import { Inventory } from '../models/Inventory.js';
import { Batch } from '../models/Batch.js';
import { StockMovement } from '../models/StockMovement.js';
import { evaluateOperationalAlerts } from './alertRuleEngine.js';
import { logAudit } from './auditService.js';

export const executeStockMovement = async ({
  movementType,
  productId,
  batchId,
  sourceWarehouseId = null,
  destinationWarehouseId = null,
  quantity,
  referenceNumber,
  performedByUser,
  notes = ''
}) => {
  if (!quantity || quantity <= 0) {
    throw new Error('Movement quantity must be a positive integer greater than 0.');
  }

  // Fetch batch and check status
  const batch = await Batch.findById(batchId).populate('product');
  if (!batch) {
    throw new Error('Batch record not found.');
  }

  if (movementType === 'OUTBOUND' || movementType === 'TRANSFER') {
    const now = new Date();
    if (batch.expiryDate <= now) {
      throw new Error(`Cannot dispatch or transfer expired batch (${batch.batchNumber}, expired on ${new Date(batch.expiryDate).toLocaleDateString()}). Quarantine required.`);
    }
  }

  const generatedRef = referenceNumber || `MOV-${Date.now().toString().slice(-6)}`;

  // Process based on movement type
  if (movementType === 'INBOUND') {
    if (!destinationWarehouseId) {
      throw new Error('Destination warehouse is required for inbound stock movement.');
    }

    let inv = await Inventory.findOne({
      product: productId,
      batch: batchId,
      warehouse: destinationWarehouseId
    });

    if (!inv) {
      inv = new Inventory({
        product: productId,
        batch: batchId,
        warehouse: destinationWarehouseId,
        quantity: 0,
        reservedQuantity: 0
      });
    }

    inv.quantity += quantity;
    await inv.save();

    // Update batch quantity
    batch.currentQuantity += quantity;
    await batch.save();

  } else if (movementType === 'OUTBOUND') {
    if (!sourceWarehouseId) {
      throw new Error('Source warehouse is required for outbound stock movement.');
    }

    const inv = await Inventory.findOne({
      product: productId,
      batch: batchId,
      warehouse: sourceWarehouseId
    });

    const available = inv ? (inv.quantity - inv.reservedQuantity) : 0;
    if (!inv || available < quantity) {
      throw new Error(`Insufficient available stock in warehouse. Available: ${available}, Requested: ${quantity}`);
    }

    inv.quantity -= quantity;
    await inv.save();

    batch.currentQuantity = Math.max(0, batch.currentQuantity - quantity);
    await batch.save();

  } else if (movementType === 'TRANSFER') {
    if (!sourceWarehouseId || !destinationWarehouseId) {
      throw new Error('Both source and destination warehouses are required for a transfer.');
    }
    if (String(sourceWarehouseId) === String(destinationWarehouseId)) {
      throw new Error('Source and destination warehouse cannot be the same.');
    }

    // Deduct from source
    const sourceInv = await Inventory.findOne({
      product: productId,
      batch: batchId,
      warehouse: sourceWarehouseId
    });

    const sourceAvailable = sourceInv ? (sourceInv.quantity - sourceInv.reservedQuantity) : 0;
    if (!sourceInv || sourceAvailable < quantity) {
      throw new Error(`Insufficient stock in source warehouse. Available: ${sourceAvailable}, Requested: ${quantity}`);
    }

    sourceInv.quantity -= quantity;
    await sourceInv.save();

    // Add to destination
    let destInv = await Inventory.findOne({
      product: productId,
      batch: batchId,
      warehouse: destinationWarehouseId
    });

    if (!destInv) {
      destInv = new Inventory({
        product: productId,
        batch: batchId,
        warehouse: destinationWarehouseId,
        quantity: 0,
        reservedQuantity: 0
      });
    }

    destInv.quantity += quantity;
    await destInv.save();

  } else if (movementType === 'ADJUSTMENT') {
    const warehouseId = sourceWarehouseId || destinationWarehouseId;
    if (!warehouseId) {
      throw new Error('Warehouse is required for inventory adjustment.');
    }

    let inv = await Inventory.findOne({
      product: productId,
      batch: batchId,
      warehouse: warehouseId
    });

    if (!inv) {
      inv = new Inventory({
        product: productId,
        batch: batchId,
        warehouse: warehouseId,
        quantity: 0,
        reservedQuantity: 0
      });
    }

    // Adjustment quantity is treated as the new target quantity
    const delta = quantity - inv.quantity;
    inv.quantity = quantity;
    if (inv.quantity < inv.reservedQuantity) {
      throw new Error('Adjusted quantity cannot be less than already reserved quantity.');
    }
    await inv.save();

    batch.currentQuantity = Math.max(0, batch.currentQuantity + delta);
    await batch.save();
  }

  // Create StockMovement record
  const movement = await StockMovement.create({
    movementType,
    product: productId,
    batch: batchId,
    sourceWarehouse: sourceWarehouseId,
    destinationWarehouse: destinationWarehouseId,
    quantity,
    referenceNumber: generatedRef,
    performedBy: performedByUser._id || performedByUser.id,
    notes,
    timestamp: new Date()
  });

  // Log audit
  await logAudit({
    user: performedByUser,
    action: 'STOCK_MOVEMENT',
    entity: 'Inventory',
    entityId: movement._id,
    description: `Recorded ${movementType} movement of ${quantity} units for product ${batch.product?.name || productId} (Batch ${batch.batchNumber}). Ref: ${generatedRef}`,
    metadata: { movementType, quantity, referenceNumber: generatedRef }
  });

  // Trigger alert rule engine asynchronously
  evaluateOperationalAlerts().catch(err => console.error('[Post-Movement Alert Check Failed]', err.message));

  return movement;
};