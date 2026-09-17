import { Product } from '../models/Product.js';
import { Batch } from '../models/Batch.js';
import { Inventory } from '../models/Inventory.js';
import { Warehouse } from '../models/Warehouse.js';
import { Shipment } from '../models/Shipment.js';
import { Alert } from '../models/Alert.js';

export const evaluateOperationalAlerts = async () => {
  try {
    const now = new Date();

    // 1 & 2: Check Low Stock and Out of Stock Products
    const products = await Product.find({ status: 'ACTIVE' });
    for (const product of products) {
      const inventoryRecords = await Inventory.find({ product: product._id });
      const totalAvailable = inventoryRecords.reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0);

      if (totalAvailable === 0) {
        await upsertAlert({
          alertType: 'OUT_OF_STOCK',
          severity: 'CRITICAL',
          title: `Product Out of Stock: ${product.name}`,
          message: `Product ${product.name} (${product.productCode}) has 0 available units across all warehouses. Reorder immediately.`,
          relatedEntity: 'Product',
          relatedEntityId: product._id,
          relatedEntityCode: product.productCode
        });
      } else if (totalAvailable <= product.minimumStockLevel) {
        await upsertAlert({
          alertType: 'LOW_STOCK',
          severity: 'WARNING',
          title: `Low Stock Alert: ${product.name}`,
          message: `Available stock for ${product.name} (${product.productCode}) is ${totalAvailable} units, which is below the minimum threshold of ${product.minimumStockLevel}.`,
          relatedEntity: 'Product',
          relatedEntityId: product._id,
          relatedEntityCode: product.productCode
        });
      }
    }

    // 3, 4 & 5: Check Batches for Expiry
    const batches = await Batch.find({ status: 'RELEASED', currentQuantity: { $gt: 0 } }).populate('product');
    for (const batch of batches) {
      const expiry = new Date(batch.expiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const prodName = batch.product?.name || 'Product';

      if (daysLeft <= 0) {
        await upsertAlert({
          alertType: 'EXPIRED_BATCH',
          severity: 'CRITICAL',
          title: `Expired Batch: ${batch.batchNumber}`,
          message: `Batch ${batch.batchNumber} of ${prodName} expired on ${expiry.toLocaleDateString()}. Quarantine immediately; cannot be shipped.`,
          relatedEntity: 'Batch',
          relatedEntityId: batch._id,
          relatedEntityCode: batch.batchNumber
        });
      } else if (daysLeft <= 30) {
        await upsertAlert({
          alertType: 'EXPIRY_WARNING',
          severity: 'CRITICAL',
          title: `Critical Expiry Risk: ${batch.batchNumber}`,
          message: `Batch ${batch.batchNumber} of ${prodName} expires in ${daysLeft} days (${expiry.toLocaleDateString()}). Prioritize FEFO dispatch.`,
          relatedEntity: 'Batch',
          relatedEntityId: batch._id,
          relatedEntityCode: batch.batchNumber
        });
      } else if (daysLeft <= 90) {
        await upsertAlert({
          alertType: 'EXPIRY_WARNING',
          severity: 'WARNING',
          title: `Expiry Warning: ${batch.batchNumber}`,
          message: `Batch ${batch.batchNumber} of ${prodName} expires in ${daysLeft} days. Monitor stock levels.`,
          relatedEntity: 'Batch',
          relatedEntityId: batch._id,
          relatedEntityCode: batch.batchNumber
        });
      }
    }

    // 6: Check Warehouse Capacity Utilization
    const warehouses = await Warehouse.find({ status: 'ACTIVE' });
    for (const warehouse of warehouses) {
      const warehouseInventory = await Inventory.find({ warehouse: warehouse._id });
      const currentStock = warehouseInventory.reduce((sum, item) => sum + item.quantity, 0);
      const utilizationPercent = Math.round((currentStock / warehouse.capacity) * 100);

      if (utilizationPercent >= 90) {
        await upsertAlert({
          alertType: 'WAREHOUSE_CAPACITY',
          severity: 'CRITICAL',
          title: `Warehouse High Utilization: ${warehouse.name}`,
          message: `${warehouse.name} (${warehouse.code}) is operating at ${utilizationPercent}% capacity (${currentStock}/${warehouse.capacity} units). Risk of intake overflow.`,
          relatedEntity: 'Warehouse',
          relatedEntityId: warehouse._id,
          relatedEntityCode: warehouse.code
        });
      } else if (utilizationPercent >= 75) {
        await upsertAlert({
          alertType: 'WAREHOUSE_CAPACITY',
          severity: 'WARNING',
          title: `Warehouse Capacity Warning: ${warehouse.name}`,
          message: `${warehouse.name} (${warehouse.code}) is currently at ${utilizationPercent}% capacity. Consider rebalancing stock.`,
          relatedEntity: 'Warehouse',
          relatedEntityId: warehouse._id,
          relatedEntityCode: warehouse.code
        });
      }
    }

    // 7: Check Delayed Shipments
    const pendingShipments = await Shipment.find({
      status: { $in: ['DISPATCHED', 'IN_TRANSIT', 'PENDING'] },
      expectedDeliveryDate: { $lt: now }
    });

    for (const shipment of pendingShipments) {
      if (shipment.status !== 'DELAYED') {
        shipment.status = 'DELAYED';
        shipment.statusHistory.push({
          status: 'DELAYED',
          timestamp: new Date(),
          note: 'Automated Rule: Expected delivery date elapsed without confirmation'
        });
        await shipment.save();
      }

      await upsertAlert({
        alertType: 'SHIPMENT_DELAY',
        severity: 'WARNING',
        title: `Shipment Delayed: ${shipment.shipmentId}`,
        message: `Shipment ${shipment.shipmentId} bound for ${shipment.destination.facilityName} is past its expected delivery date of ${new Date(shipment.expectedDeliveryDate).toLocaleDateString()}.`,
        relatedEntity: 'Shipment',
        relatedEntityId: shipment._id,
        relatedEntityCode: shipment.shipmentId
      });
    }

  } catch (err) {
    console.error('[Alert Rule Engine Error]', err.message);
  }
};

async function upsertAlert({ alertType, severity, title, message, relatedEntity, relatedEntityId, relatedEntityCode }) {
  const existing = await Alert.findOne({
    alertType,
    relatedEntity,
    relatedEntityCode,
    isResolved: false
  });

  if (!existing) {
    await Alert.create({
      alertType,
      severity,
      title,
      message,
      relatedEntity,
      relatedEntityId,
      relatedEntityCode,
      isRead: false,
      isResolved: false
    });
  } else {
    existing.severity = severity;
    existing.message = message;
    existing.title = title;
    await existing.save();
  }
}