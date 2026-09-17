import { Warehouse } from '../models/Warehouse.js';
import { Inventory } from '../models/Inventory.js';
import { StockMovement } from '../models/StockMovement.js';
import { Shipment } from '../models/Shipment.js';
import { logAudit } from '../services/auditService.js';
import { evaluateOperationalAlerts } from '../services/alertRuleEngine.js';

export const getWarehouses = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const warehouses = await Warehouse.find(query).populate('manager', 'name email');

    const enrichedWarehouses = await Promise.all(
      warehouses.map(async (wh) => {
        const invs = await Inventory.find({ warehouse: wh._id });
        const currentStock = invs.reduce((sum, item) => sum + item.quantity, 0);
        const reservedStock = invs.reduce((sum, item) => sum + item.reservedQuantity, 0);
        const utilizationPercent = Math.round((currentStock / wh.capacity) * 100);

        let utilizationStatus = 'GREEN';
        if (utilizationPercent >= 90) utilizationStatus = 'CRITICAL';
        else if (utilizationPercent >= 70) utilizationStatus = 'WARNING';

        const whObj = wh.toObject();
        whObj.currentStock = currentStock;
        whObj.reservedStock = reservedStock;
        whObj.utilizationPercent = utilizationPercent;
        whObj.utilizationStatus = utilizationStatus;
        return whObj;
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedWarehouses
    });
  } catch (err) {
    next(err);
  }
};

export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'name email');
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    }

    // Inventory in this warehouse
    const inventories = await Inventory.find({ warehouse: warehouse._id })
      .populate('product', 'name productCode genericName category unitOfMeasure')
      .populate('batch', 'batchNumber expiryDate status');

    const currentStock = inventories.reduce((sum, item) => sum + item.quantity, 0);
    const reservedStock = inventories.reduce((sum, item) => sum + item.reservedQuantity, 0);
    const utilizationPercent = Math.round((currentStock / warehouse.capacity) * 100);

    let utilizationStatus = 'GREEN';
    if (utilizationPercent >= 90) utilizationStatus = 'CRITICAL';
    else if (utilizationPercent >= 70) utilizationStatus = 'WARNING';

    // Recent movements
    const recentMovements = await StockMovement.find({
      $or: [{ sourceWarehouse: warehouse._id }, { destinationWarehouse: warehouse._id }]
    })
      .populate('product', 'name productCode')
      .populate('batch', 'batchNumber')
      .sort({ timestamp: -1 })
      .limit(10);

    // Incoming & outgoing shipments
    const incomingShipments = await Shipment.find({
      destinationFacilityId: warehouse._id,
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    }).limit(5);

    const outgoingShipments = await Shipment.find({
      sourceWarehouse: warehouse._id,
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    }).limit(5);

    res.status(200).json({
      success: true,
      warehouse: {
        ...warehouse.toObject(),
        currentStock,
        reservedStock,
        utilizationPercent,
        utilizationStatus
      },
      inventories,
      recentMovements,
      incomingShipments,
      outgoingShipments
    });
  } catch (err) {
    next(err);
  }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const { name, code, location, manager, capacity, contactPhone, contactEmail } = req.body;

    const existing = await Warehouse.findOne({ code: code?.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Warehouse with code '${code}' already exists.`
      });
    }

    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase().trim(),
      location,
      manager: manager || null,
      capacity: Number(capacity),
      contactPhone,
      contactEmail,
      status: 'ACTIVE'
    });

    await logAudit({
      user: req.user,
      action: 'WAREHOUSE_CREATED',
      entity: 'Warehouse',
      entityId: warehouse._id,
      description: `Created warehouse hub ${warehouse.name} (${warehouse.code}) with capacity of ${warehouse.capacity} units.`
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully.',
      warehouse
    });
  } catch (err) {
    next(err);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    }

    Object.assign(warehouse, req.body);
    await warehouse.save();

    await logAudit({
      user: req.user,
      action: 'WAREHOUSE_UPDATED',
      entity: 'Warehouse',
      entityId: warehouse._id,
      description: `Updated warehouse details for ${warehouse.name} (${warehouse.code}).`
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully.',
      warehouse
    });
  } catch (err) {
    next(err);
  }
};