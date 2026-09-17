import { Batch } from '../models/Batch.js';
import { Inventory } from '../models/Inventory.js';
import { Product } from '../models/Product.js';
import { logAudit } from '../services/auditService.js';
import { getFefoRecommendations } from '../services/fefoService.js';
import { evaluateOperationalAlerts } from '../services/alertRuleEngine.js';

export const getBatches = async (req, res, next) => {
  try {
    const { search, status, expiryStatus, product, warehouse, page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (product && product !== 'ALL') {
      query.product = product;
    }

    if (warehouse && warehouse !== 'ALL') {
      query.warehouse = warehouse;
    }

    if (search) {
      query.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
      .populate('product', 'name productCode genericName category dosageForm strength')
      .populate('warehouse', 'name code location')
      .sort({ expiryDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Optional expiryStatus filter applied after virtual computation
    let filteredBatches = batches;
    if (expiryStatus && expiryStatus !== 'ALL') {
      filteredBatches = batches.filter(b => b.expiryStatus === expiryStatus);
    }

    res.status(200).json({
      success: true,
      data: filteredBatches,
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

export const getBatchById = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('product')
      .populate('warehouse');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const inventory = await Inventory.findOne({ batch: batch._id, warehouse: batch.warehouse?._id });

    res.status(200).json({
      success: true,
      batch,
      inventory
    });
  } catch (err) {
    next(err);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const {
      batchNumber,
      productId,
      warehouseId,
      manufacturingDate,
      expiryDate,
      initialQuantity,
      supplier
    } = req.body;

    const mfg = new Date(manufacturingDate);
    const exp = new Date(expiryDate);

    if (exp <= mfg) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after manufacturing date.'
      });
    }

    const existing = await Batch.findOne({
      product: productId,
      batchNumber: batchNumber.toUpperCase().trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Batch number '${batchNumber}' already exists for this product.`
      });
    }

    const qty = Number(initialQuantity) || 0;

    const batch = await Batch.create({
      batchNumber: batchNumber.toUpperCase().trim(),
      product: productId,
      warehouse: warehouseId,
      manufacturingDate: mfg,
      expiryDate: exp,
      initialQuantity: qty,
      currentQuantity: qty,
      supplier: supplier || 'Authorized Pharma Supplier',
      status: 'RELEASED'
    });

    // Create or update initial Inventory record
    let inv = await Inventory.findOne({
      product: productId,
      batch: batch._id,
      warehouse: warehouseId
    });

    if (!inv) {
      inv = await Inventory.create({
        product: productId,
        batch: batch._id,
        warehouse: warehouseId,
        quantity: qty,
        reservedQuantity: 0
      });
    } else {
      inv.quantity += qty;
      await inv.save();
    }

    const product = await Product.findById(productId);

    await logAudit({
      user: req.user,
      action: 'BATCH_CREATED',
      entity: 'Batch',
      entityId: batch._id,
      description: `Created batch ${batch.batchNumber} with ${qty} units for ${product?.name || productId}. Expiry: ${exp.toLocaleDateString()}`,
      metadata: batch.toObject()
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(201).json({
      success: true,
      message: 'Batch created and inventory initialized successfully.',
      batch
    });
  } catch (err) {
    next(err);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('product');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const oldStatus = batch.status;
    if (req.body.status) batch.status = req.body.status;
    if (req.body.supplier) batch.supplier = req.body.supplier;
    await batch.save();

    await logAudit({
      user: req.user,
      action: 'BATCH_UPDATED',
      entity: 'Batch',
      entityId: batch._id,
      description: `Updated status of batch ${batch.batchNumber} (${batch.product?.name}) from ${oldStatus} to ${batch.status}.`
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully.',
      batch
    });
  } catch (err) {
    next(err);
  }
};

export const getFefoRecommendationsHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity = 0, warehouseId } = req.query;

    const recommendations = await getFefoRecommendations(
      productId,
      Number(quantity),
      warehouseId || null
    );

    res.status(200).json({
      success: true,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};