import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required'],
    index: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  reservedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Reserved quantity cannot be negative'],
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Composite unique index
inventorySchema.index({ product: 1, batch: 1, warehouse: 1 }, { unique: true });

// Virtual for Available Quantity
inventorySchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.quantity - this.reservedQuantity);
});

// Status helper
inventorySchema.virtual('stockStatus').get(function() {
  const avail = this.availableQuantity;
  if (avail <= 0) return 'OUT_OF_STOCK';
  if (avail < 50) return 'CRITICAL';
  if (avail < 150) return 'LOW_STOCK';
  return 'HEALTHY';
});

export const Inventory = mongoose.model('Inventory', inventorySchema);