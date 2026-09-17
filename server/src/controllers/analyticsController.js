import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Batch } from '../models/Batch.js';
import { Warehouse } from '../models/Warehouse.js';
import { Shipment } from '../models/Shipment.js';
import { StockMovement } from '../models/StockMovement.js';
import { Alert } from '../models/Alert.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // 1. Total Active Products
    const totalProducts = await Product.countDocuments({ status: 'ACTIVE' });

    // 2. Total Inventory Units & Low Stock calculation
    const products = await Product.find({ status: 'ACTIVE' });
    const inventories = await Inventory.find();

    const totalInventoryUnits = inventories.reduce((sum, item) => sum + item.quantity, 0);
    const totalAvailableUnits = inventories.reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0);

    let lowStockCount = 0;
    for (const prod of products) {
      const prodInvs = inventories.filter(i => String(i.product) === String(prod._id));
      const avail = prodInvs.reduce((sum, i) => sum + Math.max(0, i.quantity - i.reservedQuantity), 0);
      if (avail <= prod.minimumStockLevel) {
        lowStockCount++;
      }
    }

    // 3. Batches expiring soon & risk breakdown
    const batches = await Batch.find({ status: 'RELEASED', currentQuantity: { $gt: 0 } });
    let expiringSoonCount = 0;
    let criticalExpiryCount = 0;
    let expiredBatchCount = 0;
    let safeBatchCount = 0;

    for (const b of batches) {
      const days = b.daysUntilExpiry;
      if (days <= 0) expiredBatchCount++;
      else if (days <= 30) {
        criticalExpiryCount++;
        expiringSoonCount++;
      } else if (days <= 90) {
        expiringSoonCount++;
      } else {
        safeBatchCount++;
      }
    }

    // 4. Active Shipments
    const activeShipments = await Shipment.countDocuments({
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    });

    // 5. Priority Alerts (Top 5 unresolved)
    const priorityAlerts = await Alert.find({ isResolved: false })
      .sort({ severity: 1, createdAt: -1 })
      .limit(5);

    // 6. Chart A: Inventory Distribution by Warehouse
    const warehouses = await Warehouse.find({ status: 'ACTIVE' });
    const warehouseDistribution = warehouses.map(wh => {
      const whInvs = inventories.filter(i => String(i.warehouse) === String(wh._id));
      const current = whInvs.reduce((sum, i) => sum + i.quantity, 0);
      const capacity = wh.capacity;
      const utilization = Math.round((current / capacity) * 100);
      return {
        warehouseId: wh._id,
        name: wh.name,
        code: wh.code,
        units: current,
        capacity,
        utilization
      };
    });

    // 7. Chart B: Inventory Movement (Last 7 days Inbound vs Outbound)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentMovements = await StockMovement.find({
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });

    const movementTrendsMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      movementTrendsMap[dayLabel] = { date: dayLabel, inbound: 0, outbound: 0 };
    }

    for (const mov of recentMovements) {
      const movDate = new Date(mov.timestamp);
      const dayLabel = movDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (movementTrendsMap[dayLabel]) {
        if (mov.movementType === 'INBOUND') {
          movementTrendsMap[dayLabel].inbound += mov.quantity;
        } else if (mov.movementType === 'OUTBOUND') {
          movementTrendsMap[dayLabel].outbound += mov.quantity;
        }
      }
    }
    const movementTrends = Object.values(movementTrendsMap);

    // 8. Chart C: Product Category Distribution
    const categoryMap = {};
    for (const prod of products) {
      const prodInvs = inventories.filter(i => String(i.product) === String(prod._id));
      const units = prodInvs.reduce((sum, i) => sum + i.quantity, 0);
      categoryMap[prod.category] = (categoryMap[prod.category] || 0) + units;
    }
    const categoryDistribution = Object.entries(categoryMap).map(([category, units]) => ({
      category,
      units
    }));

    // 9. Chart D: Shipment Status Distribution
    const allShipments = await Shipment.find();
    const shipmentStatusMap = {
      PENDING: 0,
      DISPATCHED: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      DELAYED: 0,
      CANCELLED: 0
    };
    for (const s of allShipments) {
      shipmentStatusMap[s.status] = (shipmentStatusMap[s.status] || 0) + 1;
    }
    const shipmentStatusDistribution = Object.entries(shipmentStatusMap).map(([status, count]) => ({
      status,
      count
    }));

    // 10. Chart E: Expiry Risk Overview
    const expiryRiskData = [
      { category: 'Safe (> 90d)', count: safeBatchCount, color: '#10b981' },
      { category: 'Warning (30-90d)', count: expiringSoonCount - criticalExpiryCount, color: '#f59e0b' },
      { category: 'Critical (< 30d)', count: criticalExpiryCount, color: '#ef4444' },
      { category: 'Expired', count: expiredBatchCount, color: '#64748b' }
    ];

    res.status(200).json({
      success: true,
      kpis: {
        totalProducts,
        totalInventoryUnits,
        totalAvailableUnits,
        lowStockCount,
        expiringSoonCount,
        activeShipments,
        criticalAlertsCount: priorityAlerts.filter(a => a.severity === 'CRITICAL').length
      },
      priorityAlerts,
      charts: {
        warehouseDistribution,
        movementTrends,
        categoryDistribution,
        shipmentStatusDistribution,
        expiryRiskData
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const { timeframe = '30d' } = req.query;
    const now = new Date();
    let days = 30;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === '6m') days = 180;
    else if (timeframe === '1y') days = 365;

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Calculate total inventory valuation
    const products = await Product.find();
    const inventories = await Inventory.find();

    let totalValuation = 0;
    for (const inv of inventories) {
      const prod = products.find(p => String(p._id) === String(inv.product));
      if (prod) {
        totalValuation += inv.quantity * (prod.unitPrice || 0);
      }
    }

    // Most frequently moved products
    const movements = await StockMovement.find({ timestamp: { $gte: startDate } }).populate('product', 'name productCode');
    const productMovementMap = {};
    for (const m of movements) {
      const prodId = m.product?._id ? String(m.product._id) : 'unknown';
      if (!productMovementMap[prodId]) {
        productMovementMap[prodId] = {
          name: m.product?.name || 'Unknown Product',
          code: m.product?.productCode || '',
          totalQuantity: 0,
          movementCount: 0
        };
      }
      productMovementMap[prodId].totalQuantity += m.quantity;
      productMovementMap[prodId].movementCount++;
    }

    const topMovedProducts = Object.values(productMovementMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 8);

    // Carrier performance (Delivered vs Delayed)
    const shipments = await Shipment.find({ createdAt: { $gte: startDate } });
    const carrierMap = {};
    for (const s of shipments) {
      if (!carrierMap[s.carrier]) {
        carrierMap[s.carrier] = { carrier: s.carrier, total: 0, delivered: 0, delayed: 0 };
      }
      carrierMap[s.carrier].total++;
      if (s.status === 'DELIVERED') carrierMap[s.carrier].delivered++;
      if (s.status === 'DELAYED') carrierMap[s.carrier].delayed++;
    }
    const carrierPerformance = Object.values(carrierMap);

    res.status(200).json({
      success: true,
      timeframe,
      totalValuation: Math.round(totalValuation),
      topMovedProducts,
      carrierPerformance
    });
  } catch (err) {
    next(err);
  }
};