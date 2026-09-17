import { Batch } from '../models/Batch.js';
import { Inventory } from '../models/Inventory.js';

export const getFefoRecommendations = async (productId, requestedQuantity = 0, warehouseId = null) => {
  const now = new Date();

  // Query batches for the product that are released and not expired
  const query = {
    product: productId,
    status: 'RELEASED',
    expiryDate: { $gt: now },
    currentQuantity: { $gt: 0 }
  };

  if (warehouseId) {
    query.warehouse = warehouseId;
  }

  // Sort strictly ascending by expiry date (FEFO)
  const batches = await Batch.find(query)
    .sort({ expiryDate: 1 })
    .populate('warehouse', 'name code');

  let remainingToAllocate = requestedQuantity;
  const allocations = [];
  let totalAvailable = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Find actual available inventory for this batch & warehouse
    const warehouseIdForInv = batch.warehouse?._id || batch.warehouse;
    const inv = await Inventory.findOne({
      product: productId,
      batch: batch._id,
      warehouse: warehouseIdForInv
    });

    const available = inv ? Math.max(0, inv.quantity - inv.reservedQuantity) : 0;
    if (available <= 0) continue;

    totalAvailable += available;

    let allocate = 0;
    if (remainingToAllocate > 0) {
      allocate = Math.min(remainingToAllocate, available);
      remainingToAllocate -= allocate;
    }

    const isTopFefo = allocations.length === 0; // The first actually available batch is top recommendation

    allocations.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysUntilExpiry: batch.daysUntilExpiry,
      warehouse: batch.warehouse,
      availableQuantity: available,
      allocatedQuantity: allocate,
      isFefoRecommended: isTopFefo
    });
  }

  return {
    productId,
    requestedQuantity,
    totalAvailable,
    canFulfill: totalAvailable >= requestedQuantity,
    allocations
  };
};