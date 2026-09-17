import { Shipment } from '../models/Shipment.js';
import { Inventory } from '../models/Inventory.js';
import { Batch } from '../models/Batch.js';
import { StockMovement } from '../models/StockMovement.js';
import { logAudit } from '../services/auditService.js';
import { evaluateOperationalAlerts } from '../services/alertRuleEngine.js';

export const getShipments = async (req, res, next) => {
  try {
    const { status, sourceWarehouse, search, page = 1, limit = 15 } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (sourceWarehouse && sourceWarehouse !== 'ALL') query.sourceWarehouse = sourceWarehouse;
    if (search) {
      query.$or = [
        { shipmentId: { $regex: search, $options: 'i' } },
        { carrier: { $regex: search, $options: 'i' } },
        { 'destination.facilityName': { $regex: search, $options: 'i' } },
        { 'destination.city': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate('sourceWarehouse', 'name code location')
      .populate('items.product', 'name productCode genericName')
      .populate('items.batch', 'batchNumber expiryDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('sourceWarehouse', 'name code location contactPhone contactEmail')
      .populate('items.product')
      .populate('items.batch')
      .populate('statusHistory.updatedBy', 'name role');

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    res.status(200).json({
      success: true,
      shipment
    });
  } catch (err) {
    next(err);
  }
};

export const createShipment = async (req, res, next) => {
  try {
    const {
      sourceWarehouseId,
      destination,
      carrier,
      temperatureRequirement,
      items,
      expectedDeliveryDate,
      trackingNumber,
      notes
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Shipment must contain at least one pharmaceutical item.' });
    }

    const now = new Date();
    const expDelivery = new Date(expectedDeliveryDate);

    // Validate availability and batch validity for all items first
    for (const item of items) {
      const batch = await Batch.findById(item.batch);
      if (!batch) {
        return res.status(400).json({ success: false, message: `Batch ${item.batch} not found.` });
      }

      if (batch.expiryDate <= now) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batch.batchNumber} has EXPIRED (${new Date(batch.expiryDate).toLocaleDateString()}). Expired batches cannot be shipped.`
        });
      }

      if (batch.status !== 'RELEASED') {
        return res.status(400).json({
          success: false,
          message: `Batch ${batch.batchNumber} is in ${batch.status} status and cannot be dispatched.`
        });
      }

      const inv = await Inventory.findOne({
        product: item.product,
        batch: item.batch,
        warehouse: sourceWarehouseId
      });

      const available = inv ? (inv.quantity - inv.reservedQuantity) : 0;
      if (!inv || available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient available stock for Batch ${batch.batchNumber}. Available: ${available}, Requested: ${item.quantity}.`
        });
      }
    }

    // All valid - proceed to reserve stock
    for (const item of items) {
      const inv = await Inventory.findOne({
        product: item.product,
        batch: item.batch,
        warehouse: sourceWarehouseId
      });
      inv.reservedQuantity += Number(item.quantity);
      await inv.save();
    }

    const count = await Shipment.countDocuments();
    const generatedId = `SHP-${new Date().getFullYear()}-${(1000 + count + 1).toString()}`;

    const shipment = await Shipment.create({
      shipmentId: generatedId,
      sourceWarehouse: sourceWarehouseId,
      destination,
      carrier,
      temperatureRequirement: temperatureRequirement || 'Controlled Room Temperature (15°C - 25°C)',
      items: items.map(i => ({
        product: i.product,
        batch: i.batch,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice) || 0
      })),
      expectedDeliveryDate: expDelivery,
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-8)}`,
      notes: notes || '',
      status: 'PENDING',
      statusHistory: [{
        status: 'PENDING',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: 'Shipment created and stock reserved at warehouse'
      }]
    });

    await logAudit({
      user: req.user,
      action: 'SHIPMENT_CREATED',
      entity: 'Shipment',
      entityId: shipment._id,
      description: `Created consignment ${shipment.shipmentId} to ${destination.facilityName} (${items.length} product lines).`,
      metadata: shipment.toObject()
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(201).json({
      success: true,
      message: 'Shipment created and inventory reserved.',
      shipment
    });
  } catch (err) {
    next(err);
  }
};

export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const previousStatus = shipment.status;
    if (previousStatus === status) {
      return res.status(400).json({ success: false, message: `Shipment is already in '${status}' status.` });
    }

    // Lifecycle transitions
    if (status === 'DISPATCHED' && previousStatus === 'PENDING') {
      // Dispatched: Deduct reserved quantity and total quantity, log OUTBOUND movements
      shipment.dispatchDate = new Date();

      for (const item of shipment.items) {
        const inv = await Inventory.findOne({
          product: item.product,
          batch: item.batch,
          warehouse: shipment.sourceWarehouse
        });

        if (inv) {
          inv.quantity = Math.max(0, inv.quantity - item.quantity);
          inv.reservedQuantity = Math.max(0, inv.reservedQuantity - item.quantity);
          await inv.save();
        }

        // Deduct batch currentQuantity
        const batch = await Batch.findById(item.batch);
        if (batch) {
          batch.currentQuantity = Math.max(0, batch.currentQuantity - item.quantity);
          await batch.save();
        }

        // Record OUTBOUND movement
        await StockMovement.create({
          movementType: 'OUTBOUND',
          product: item.product,
          batch: item.batch,
          sourceWarehouse: shipment.sourceWarehouse,
          quantity: item.quantity,
          referenceNumber: shipment.shipmentId,
          performedBy: req.user._id,
          notes: `Dispatched via ${shipment.carrier} to ${shipment.destination.facilityName}`
        });
      }
    } else if (status === 'DELIVERED') {
      shipment.actualDeliveryDate = new Date();
    } else if (status === 'CANCELLED' && previousStatus === 'PENDING') {
      // Release reserved quantities if cancelled before dispatch
      for (const item of shipment.items) {
        const inv = await Inventory.findOne({
          product: item.product,
          batch: item.batch,
          warehouse: shipment.sourceWarehouse
        });

        if (inv) {
          inv.reservedQuantity = Math.max(0, inv.reservedQuantity - item.quantity);
          await inv.save();
        }
      }
    }

    shipment.status = status;
    shipment.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: note || `Status updated from ${previousStatus} to ${status}`
    });

    await shipment.save();

    await logAudit({
      user: req.user,
      action: 'SHIPMENT_STATUS_CHANGED',
      entity: 'Shipment',
      entityId: shipment._id,
      description: `Shipment ${shipment.shipmentId} status updated from ${previousStatus} to ${status}.`
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(200).json({
      success: true,
      message: `Shipment status updated to ${status}.`,
      shipment
    });
  } catch (err) {
    next(err);
  }
};