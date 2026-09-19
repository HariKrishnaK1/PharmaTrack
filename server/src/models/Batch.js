import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
    index: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse reference is required'],
    index: true
  },
  manufacturingDate: {
    type: Date,
    required: [true, 'Manufacturing date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true
  },
  initialQuantity: {
    type: Number,
    required: [true, 'Initial quantity is required'],
    min: [0, 'Initial quantity cannot be negative']
  },
  currentQuantity: {
    type: Number,
    required: [true, 'Current quantity is required'],
    min: [0, 'Current quantity cannot be negative']
  },
  supplier: {
    type: String,
    required: [true, 'Supplier / API Source is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['RELEASED', 'QUARANTINE', 'RECALLED'],
    default: 'RELEASED',
    index: true
  },
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: 'PDF' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Composite index to ensure unique batch number per product
batchSchema.index({ product: 1, batchNumber: 1 }, { unique: true });

// Virtual for Days Until Expiry
batchSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return 0;
  const now = new Date();
  const diffTime = this.expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for Expiry Status classification
batchSchema.virtual('expiryStatus').get(function() {
  const days = this.daysUntilExpiry;
  if (days <= 0) return 'EXPIRED';
  if (days <= 30) return 'CRITICAL';
  if (days <= 90) return 'EXPIRING_SOON';
  return 'SAFE';
});

export const Batch = mongoose.model('Batch', batchSchema);