import { Product } from '../models/Product.js';
import { Batch } from '../models/Batch.js';
import { Warehouse } from '../models/Warehouse.js';
import { Inventory } from '../models/Inventory.js';
import { Shipment } from '../models/Shipment.js';
import { Alert } from '../models/Alert.js';
import { config } from '../config/env.js';

/**
 * Gathers a structured, real-time snapshot of the supply-chain database
 * to provide factual grounding for Gemini without hallucination.
 */
async function gatherGroundedContext() {
  try {
    const [products, batches, warehouses, inventories, shipments, alerts] = await Promise.all([
      Product.find({ status: 'ACTIVE' })
        .select('name productCode category dosageForm storageCondition requiresColdChain minimumStockLevel isControlledSubstance')
        .lean(),
      Batch.find({ status: { $ne: 'REJECTED' }, currentQuantity: { $gt: 0 } })
        .populate('product', 'name productCode')
        .populate('warehouse', 'name code')
        .lean(),
      Warehouse.find({ status: 'ACTIVE' }).lean(),
      Inventory.find().lean(),
      Shipment.find({ status: { $nin: ['DELIVERED', 'CANCELLED'] } })
        .populate('sourceWarehouse', 'name code')
        .lean(),
      Alert.find({ isResolved: false }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    // Calculate stock levels per product
    const lowStockItems = [];
    let totalNetworkUnits = 0;

    for (const prod of products) {
      const invs = inventories.filter(i => i.product && i.product.toString() === prod._id.toString());
      const available = invs.reduce((sum, i) => sum + Math.max(0, i.quantity - (i.reservedQuantity || 0)), 0);
      const totalUnits = invs.reduce((sum, i) => sum + i.quantity, 0);
      totalNetworkUnits += totalUnits;

      if (available <= prod.minimumStockLevel) {
        lowStockItems.push({
          name: prod.name,
          code: prod.productCode,
          category: prod.category,
          available,
          minThreshold: prod.minimumStockLevel,
          isOut: available === 0
        });
      }
    }

    // Identify batch risks (FEFO & Expiry)
    const now = new Date();
    const criticalBatches = [];
    const warningBatches = [];
    const expiredBatches = [];

    for (const b of batches) {
      const expiry = new Date(b.expiryDate);
      const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const info = {
        batchNumber: b.batchNumber,
        product: b.product?.name || 'Unknown',
        warehouse: b.warehouse?.name || 'Central Facility',
        units: b.currentQuantity,
        daysUntilExpiry: days,
        expiryDate: expiry.toISOString().split('T')[0],
        status: b.status
      };

      if (days <= 0) expiredBatches.push(info);
      else if (days <= 30) criticalBatches.push(info);
      else if (days <= 90) warningBatches.push(info);
    }

    // Warehouse capacity overview
    const warehouseUtilization = warehouses.map(w => {
      const invs = inventories.filter(i => i.warehouse && i.warehouse.toString() === w._id.toString());
      const currentUnits = invs.reduce((sum, i) => sum + i.quantity, 0);
      const pct = Math.round((currentUnits / (w.capacity || 1)) * 100);
      return {
        name: w.name,
        code: w.code,
        city: w.location?.city,
        capacity: w.capacity,
        currentStock: currentUnits,
        utilizationPercent: `${pct}%`,
        hasColdStorage: w.coldStorage?.available || false
      };
    });

    // Active logistics overview
    const activeShipmentsSummary = shipments.map(s => ({
      shipmentId: s.shipmentId,
      status: s.status,
      carrier: s.carrier,
      destination: s.destination?.facilityName,
      expectedDeliveryDate: s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate).toISOString().split('T')[0] : 'N/A',
      requiresColdChain: s.requiresColdChain,
      hasTemperatureExcursion: s.temperatureLogs?.some(t => t.isExcursion) || false
    }));

    return {
      overview: {
        activeProductCount: products.length,
        totalStoredUnits: totalNetworkUnits,
        totalWarehouses: warehouses.length,
        activeShipmentCount: shipments.length,
        unresolvedAlertCount: alerts.length
      },
      lowStockAlerts: lowStockItems,
      batchStatus: {
        expired: expiredBatches,
        expiringWithin30Days: criticalBatches,
        expiringWithin90Days: warningBatches
      },
      warehouseUtilization,
      activeShipments: activeShipmentsSummary,
      recentAlerts: alerts.map(a => ({
        severity: a.severity,
        type: a.type,
        title: a.title,
        message: a.message
      }))
    };
  } catch (err) {
    console.error('[AI Assistant] Error gathering DB context:', err.message);
    return null;
  }
}

/**
 * Calls Google Gemini API (gemini-3.6-flash) with grounded operational context.
 */
async function callGemini(queryText, context) {
  const apiKey = config.geminiApiKey || config.aiApiKey;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `You are the PharmaTrack AI Assistant, an expert digital pharmaceutical supply chain and inventory copilot.
You operate on live operational data from the company's enterprise MongoDB database.

CRITICAL OPERATIONAL RULES:
1. STRICT TRUTHFULNESS: Rely ONLY on the provided Operational Context. Never fabricate batches, SKUs, inventory counts, or facilities.
2. PHARMA TERMINOLOGY & BEST PRACTICES: Emphasize First-Expiry-First-Out (FEFO), Cold-Chain compliance (2°C - 8°C), GxP / 21 CFR Part 11 audit integrity, and batch quarantine workflows.
3. STRUCTURE & CLARITY: Use clean Markdown with bold metrics, bullet points, and urgency icons (⚠️ for low stock/expiring batches, 🚨 for delays or excursions, ✅ for healthy metrics).
4. ACTIONABILITY: Conclude with a concrete operational next step for the warehouse or inventory manager when an issue or risk is identified.
5. CONCISENESS: Keep answers focused and executive-ready (2-4 paragraphs or formatted bulleted sections).`;

  const userPrompt = `LIVE OPERATIONAL CONTEXT (Direct from MongoDB Atlas):
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

USER QUESTION:
"${queryText}"

Provide a professional, data-grounded response for the pharmaceutical operations team.`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 800,
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Gemini API Error] HTTP ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (textPart && textPart.trim()) {
      return {
        text: textPart.trim(),
        model: 'gemini-3.6-flash',
        provider: 'Google Gemini AI'
      };
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Gemini API Call Failed]:', err.message);
    return null;
  }
}

/**
 * Deterministic fallback engine when Gemini API is unavailable or offline.
 */
async function processDeterministicQuery(queryText = '') {
  const query = queryText.toLowerCase().trim();

  // 1. Low stock or shortage inquiry
  if (
    query.includes('low stock') ||
    (query.includes('low') && query.includes('stock')) ||
    query.includes('reorder') ||
    query.includes('out of stock') ||
    query.includes('minimum stock') ||
    query.includes('shortage')
  ) {
    const products = await Product.find({ status: 'ACTIVE' });
    const lowStockItems = [];

    for (const prod of products) {
      const invs = await Inventory.find({ product: prod._id });
      const available = invs.reduce((sum, i) => sum + Math.max(0, i.quantity - i.reservedQuantity), 0);
      if (available <= prod.minimumStockLevel) {
        lowStockItems.push({
          name: prod.name,
          code: prod.productCode,
          available,
          minLevel: prod.minimumStockLevel,
          isOut: available === 0
        });
      }
    }

    if (lowStockItems.length === 0) {
      return {
        query: queryText,
        intent: 'LOW_STOCK_QUERY',
        answer: 'All active pharmaceutical products are currently operating at or above their safety stock levels. No reorders required.',
        data: []
      };
    }

    lowStockItems.sort((a, b) => (a.available - a.minLevel) - (b.available - b.minLevel));
    const mostCritical = lowStockItems[0];
    const details = lowStockItems.slice(0, 5).map(item =>
      `• **${item.name}** (${item.code}): ${item.available} units available (Min threshold: ${item.minLevel}) ${item.isOut ? '⚠️ OUT OF STOCK' : ''}`
    ).join('\n');

    return {
      query: queryText,
      intent: 'LOW_STOCK_QUERY',
      answer: `There are currently **${lowStockItems.length} products** below minimum stock levels across the network. The most critical is **${mostCritical.name}** with ${mostCritical.available} units remaining against a threshold of ${mostCritical.minLevel}.\n\n${details}`,
      data: lowStockItems
    };
  }

  // 2. Batch expiry inquiry (FEFO)
  if (
    query.includes('expir') ||
    query.includes('batch') ||
    query.includes('shelf life') ||
    query.includes('fefo')
  ) {
    const batches = await Batch.find({ status: 'RELEASED', currentQuantity: { $gt: 0 } })
      .populate('product', 'name productCode')
      .populate('warehouse', 'name code');

    const expired = [];
    const critical30 = [];
    const warning90 = [];

    for (const b of batches) {
      const days = b.daysUntilExpiry;
      const item = {
        batchNumber: b.batchNumber,
        product: b.product?.name || 'Unknown',
        warehouse: b.warehouse?.name || 'Central Facility',
        currentQuantity: b.currentQuantity,
        daysUntilExpiry: days,
        expiryDate: new Date(b.expiryDate).toLocaleDateString()
      };

      if (days <= 0) expired.push(item);
      else if (days <= 30) critical30.push(item);
      else if (days <= 90) warning90.push(item);
    }

    let summary = '';
    if (expired.length > 0) {
      summary += `⚠️ **${expired.length} batch(es) have EXPIRED** and must be placed into QUARANTINE: ` +
        expired.map(e => `${e.batchNumber} (${e.product})`).join(', ') + '.\n\n';
    }

    summary += `There are **${critical30.length} batches expiring within 30 days** (critical risk) and **${warning90.length} batches expiring within 30–90 days**.\n\n`;

    if (critical30.length > 0) {
      summary += '**Upcoming critical expiries (prioritize FEFO dispatch):**\n' +
        critical30.slice(0, 4).map(b => `• **Batch ${b.batchNumber}** (${b.product}) — ${b.currentQuantity} units at ${b.warehouse}, expires in ${b.daysUntilExpiry} days (${b.expiryDate})`).join('\n');
    }

    return {
      query: queryText,
      intent: 'EXPIRY_QUERY',
      answer: summary,
      data: { expired, critical30, warning90 }
    };
  }

  // 3. Warehouse capacity & utilization
  if (
    query.includes('warehouse') ||
    query.includes('utiliz') ||
    query.includes('capacity') ||
    query.includes('space') ||
    query.includes('highest') ||
    query.includes('fullest')
  ) {
    const warehouses = await Warehouse.find({ status: 'ACTIVE' });
    const utilizationData = [];

    for (const wh of warehouses) {
      const invs = await Inventory.find({ warehouse: wh._id });
      const currentStock = invs.reduce((sum, i) => sum + i.quantity, 0);
      const utilPercent = Math.round((currentStock / (wh.capacity || 1)) * 100);
      utilizationData.push({
        name: wh.name,
        code: wh.code,
        city: wh.location?.city,
        capacity: wh.capacity,
        currentStock,
        utilizationPercent: utilPercent
      });
    }

    utilizationData.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    const highest = utilizationData[0] || { name: 'N/A', utilizationPercent: 0, currentStock: 0, capacity: 0 };
    const list = utilizationData.map(w =>
      `• **${w.name}** (${w.code} - ${w.city}): **${w.utilizationPercent}%** utilized (${w.currentStock.toLocaleString()} / ${w.capacity.toLocaleString()} units)`
    ).join('\n');

    return {
      query: queryText,
      intent: 'WAREHOUSE_UTILIZATION_QUERY',
      answer: `**${highest.name}** currently has the highest utilization at **${highest.utilizationPercent}%** (${highest.currentStock.toLocaleString()} of ${highest.capacity.toLocaleString()} units capacity).\n\n**Network Warehouse Status:**\n${list}`,
      data: utilizationData
    };
  }

  // 4. Shipments inquiry
  if (
    query.includes('shipment') ||
    query.includes('delay') ||
    query.includes('transit') ||
    query.includes('deliver') ||
    query.includes('carrier') ||
    query.includes('logistics')
  ) {
    const activeShipments = await Shipment.find({
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    }).populate('sourceWarehouse', 'name code');

    const delayed = activeShipments.filter(s => s.status === 'DELAYED');
    const inTransit = activeShipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'DISPATCHED');
    const pending = activeShipments.filter(s => s.status === 'PENDING');

    let text = `There are currently **${activeShipments.length} active shipments** in the logistics pipeline.\n`;
    text += `• In Transit: ${inTransit.length}\n• Pending Dispatch: ${pending.length}\n• Delayed: ${delayed.length}\n\n`;

    if (delayed.length > 0) {
      text += `🚨 **Delayed Shipments Requiring Attention:**\n` +
        delayed.map(d => `• **${d.shipmentId}** (Carrier: ${d.carrier}) bound for *${d.destination?.facilityName}* (Expected: ${new Date(d.expectedDeliveryDate).toLocaleDateString()})`).join('\n');
    } else {
      text += '✅ No active shipment delays detected at this time.';
    }

    return {
      query: queryText,
      intent: 'SHIPMENT_QUERY',
      answer: text,
      data: { totalActive: activeShipments.length, delayedCount: delayed.length, inTransitCount: inTransit.length }
    };
  }

  // 5. Alerts overview
  if (
    query.includes('alert') ||
    query.includes('critical') ||
    query.includes('warning') ||
    query.includes('issue') ||
    query.includes('problem')
  ) {
    const unresolvedAlerts = await Alert.find({ isResolved: false }).sort({ createdAt: -1 });
    const critical = unresolvedAlerts.filter(a => a.severity === 'CRITICAL');
    const warning = unresolvedAlerts.filter(a => a.severity === 'WARNING');

    let text = `There are currently **${unresolvedAlerts.length} unresolved operational alerts** (**${critical.length} Critical**, **${warning.length} Warning**).\n\n`;

    if (critical.length > 0) {
      text += '**Top Critical Alerts:**\n' +
        critical.slice(0, 3).map(c => `• 🔴 **${c.title}**: ${c.message}`).join('\n');
    }

    return {
      query: queryText,
      intent: 'ALERTS_QUERY',
      answer: text,
      data: unresolvedAlerts.slice(0, 10)
    };
  }

  // General summary fallback
  const totalProducts = await Product.countDocuments({ status: 'ACTIVE' });
  const totalWarehouses = await Warehouse.countDocuments({ status: 'ACTIVE' });
  const allInventories = await Inventory.find();
  const totalUnits = allInventories.reduce((sum, i) => sum + i.quantity, 0);
  const activeShipmentsCount = await Shipment.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED'] } });

  return {
    query: queryText,
    intent: 'GENERAL_SUMMARY',
    answer: `Here is a high-level summary of your pharmaceutical operations:\n\n` +
      `• **Active Products:** ${totalProducts.toLocaleString()} formulations\n` +
      `• **Total Inventory:** ${totalUnits.toLocaleString()} units stored across ${totalWarehouses} certified regional warehouses\n` +
      `• **Active Shipments:** ${activeShipmentsCount} consignments in motion\n\n` +
      `You can ask specific questions such as *"Which products are low on stock?"*, *"Which batches expire within 30 days?"*, or *"Which warehouse has the highest utilization?"*`,
    data: { totalProducts, totalUnits, totalWarehouses, activeShipmentsCount }
  };
}

/**
 * Main AI Query entrypoint:
 * Tries Google Gemini with live grounded database context first.
 * Falls back seamlessly to the deterministic rule engine if API key is absent or offline.
 */
export const processAIQuery = async (queryText = '') => {
  const context = await gatherGroundedContext();

  if (context && (config.geminiApiKey || config.aiApiKey)) {
    const geminiResult = await callGemini(queryText, context);
    if (geminiResult && geminiResult.text) {
      return {
        query: queryText,
        intent: 'GEMINI_GROUNDED_QUERY',
        answer: geminiResult.text,
        model: geminiResult.model,
        provider: geminiResult.provider,
        grounded: true,
        data: context.overview
      };
    }
  }

  // Graceful deterministic fallback
  const fallbackResult = await processDeterministicQuery(queryText);
  return {
    ...fallbackResult,
    model: 'PharmaTrack Rule-Engine',
    grounded: true
  };
};