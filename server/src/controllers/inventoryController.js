import { Inventory } from '../models/Inventory.js';
import { StockMovement } from '../models/StockMovement.js';
import { executeStockMovement } from '../services/inventoryService.js';

export const getInventory = async (req, res, next) => {
  try {
    const { warehouse, product, search, page = 1, limit = 15 } = req.query;

    const query = {};

    if (warehouse && warehouse !== 'ALL') {
      query.warehouse = warehouse;
    }

    if (product && product !== 'ALL') {
      query.product = product;
    }

    const total = await Inventory.countDocuments(query);
    const inventories = await Inventory.find(query)
      .populate('product', 'name productCode genericName category minimumStockLevel unitOfMeasure unitPrice')
      .populate('batch', 'batchNumber expiryDate manufacturingDate status')
      .populate('warehouse', 'name code location')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Optional client-level search filtering across populated fields
    let results = inventories;
    if (search) {
      const s = search.toLowerCase();
      results = inventories.filter(item =>
        item.product?.name?.toLowerCase().includes(s) ||
        item.product?.productCode?.toLowerCase().includes(s) ||
        item.batch?.batchNumber?.toLowerCase().includes(s) ||
        item.warehouse?.name?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      data: results,
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

export const recordMovement = async (req, res, next) => {
  try {
    const {
      movementType,
      productId,
      batchId,
      sourceWarehouseId,
      destinationWarehouseId,
      quantity,
      referenceNumber,
      notes
    } = req.body;

    const movement = await executeStockMovement({
      movementType,
      productId,
      batchId,
      sourceWarehouseId,
      destinationWarehouseId,
      quantity: Number(quantity),
      referenceNumber,
      performedByUser: req.user,
      notes
    });

    res.status(201).json({
      success: true,
      message: `Stock movement (${movementType}) recorded successfully.`,
      movement
    });
  } catch (err) {
    next(err);
  }
};

export const getMovements = async (req, res, next) => {
  try {
    const { movementType, warehouse, product, page = 1, limit = 15 } = req.query;

    const query = {};
    if (movementType && movementType !== 'ALL') query.movementType = movementType;
    if (product && product !== 'ALL') query.product = product;
    if (warehouse && warehouse !== 'ALL') {
      query.$or = [{ sourceWarehouse: warehouse }, { destinationWarehouse: warehouse }];
    }

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('product', 'name productCode')
      .populate('batch', 'batchNumber expiryDate')
      .populate('sourceWarehouse', 'name code')
      .populate('destinationWarehouse', 'name code')
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: movements,
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