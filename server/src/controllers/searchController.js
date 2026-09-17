import { Product } from '../models/Product.js';
import { Batch } from '../models/Batch.js';
import { Warehouse } from '../models/Warehouse.js';
import { Shipment } from '../models/Shipment.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, results: { products: [], batches: [], warehouses: [], shipments: [] } });
    }

    const regex = { $regex: q.trim(), $options: 'i' };

    const [products, batches, warehouses, shipments] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { productCode: regex }, { genericName: regex }]
      }).limit(5).select('name productCode category minimumStockLevel'),

      Batch.find({
        $or: [{ batchNumber: regex }, { supplier: regex }]
      }).populate('product', 'name productCode').limit(5),

      Warehouse.find({
        $or: [{ name: regex }, { code: regex }, { 'location.city': regex }]
      }).limit(5).select('name code location capacity'),

      Shipment.find({
        $or: [{ shipmentId: regex }, { carrier: regex }, { 'destination.facilityName': regex }]
      }).limit(5).select('shipmentId carrier destination status')
    ]);

    res.status(200).json({
      success: true,
      results: {
        products,
        batches,
        warehouses,
        shipments
      }
    });
  } catch (err) {
    next(err);
  }
};