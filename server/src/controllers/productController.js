import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Batch } from '../models/Batch.js';
import { logAudit } from '../services/auditService.js';
import { evaluateOperationalAlerts } from '../services/alertRuleEngine.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Enrich each product with live total stock calculations
    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        const invs = await Inventory.find({ product: prod._id });
        const totalStock = invs.reduce((sum, item) => sum + item.quantity, 0);
        const reservedStock = invs.reduce((sum, item) => sum + item.reservedQuantity, 0);
        const availableStock = Math.max(0, totalStock - reservedStock);

        let stockStatus = 'IN STOCK';
        if (availableStock === 0) {
          stockStatus = 'OUT OF STOCK';
        } else if (availableStock <= prod.minimumStockLevel) {
          stockStatus = 'LOW STOCK';
        }

        const prodObj = prod.toObject();
        prodObj.currentStock = totalStock;
        prodObj.reservedStock = reservedStock;
        prodObj.availableStock = availableStock;
        prodObj.stockStatus = stockStatus;
        return prodObj;
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedProducts,
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

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Get inventory breakdown across warehouses
    const inventories = await Inventory.find({ product: product._id })
      .populate('warehouse', 'name code location capacity')
      .populate('batch', 'batchNumber expiryDate status');

    // Get all batches for this product
    const batches = await Batch.find({ product: product._id })
      .populate('warehouse', 'name code')
      .sort({ expiryDate: 1 });

    const totalStock = inventories.reduce((sum, item) => sum + item.quantity, 0);
    const reservedStock = inventories.reduce((sum, item) => sum + item.reservedQuantity, 0);
    const availableStock = Math.max(0, totalStock - reservedStock);

    let stockStatus = 'IN STOCK';
    if (availableStock === 0) stockStatus = 'OUT OF STOCK';
    else if (availableStock <= product.minimumStockLevel) stockStatus = 'LOW STOCK';

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        currentStock: totalStock,
        reservedStock,
        availableStock,
        stockStatus
      },
      inventories,
      batches
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      productCode,
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      unitOfMeasure,
      minimumStockLevel,
      reorderLevel,
      unitPrice,
      description
    } = req.body;

    const existing = await Product.findOne({ productCode: productCode?.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A product with code '${productCode}' already exists.`
      });
    }

    const product = await Product.create({
      productCode,
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      unitOfMeasure: unitOfMeasure || 'Packs',
      minimumStockLevel: Number(minimumStockLevel) || 100,
      reorderLevel: Number(reorderLevel) || 200,
      unitPrice: Number(unitPrice) || 10.0,
      description: description || ''
    });

    await logAudit({
      user: req.user,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id,
      description: `Created pharmaceutical product: ${product.name} (${product.productCode}).`,
      metadata: product.toObject()
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const originalData = product.toObject();
    Object.assign(product, req.body);
    await product.save();

    await logAudit({
      user: req.user,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product._id,
      description: `Updated product ${product.name} (${product.productCode}).`,
      metadata: { previous: originalData, current: product.toObject() }
    });

    evaluateOperationalAlerts().catch(e => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if there is active inventory or batches
    const batchCount = await Batch.countDocuments({ product: product._id });
    if (batchCount > 0) {
      // Soft-delete by marking discontinued
      product.status = 'DISCONTINUED';
      await product.save();

      await logAudit({
        user: req.user,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: product._id,
        description: `Marked product ${product.name} (${product.productCode}) as DISCONTINUED because active batches exist.`
      });

      return res.status(200).json({
        success: true,
        message: 'Product marked as DISCONTINUED (cannot hard-delete due to existing historical batch records).'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: req.params.id,
      description: `Permanently deleted product ${product.name} (${product.productCode}).`
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};