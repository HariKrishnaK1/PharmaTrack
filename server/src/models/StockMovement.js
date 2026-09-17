import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  movementType: {
    type: String,
    enum: ['INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'],
    required: [true, 'Movement type is required'],
    index: true
  },
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
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null,
    index: true
  },
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null,
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Movement quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  referenceNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);