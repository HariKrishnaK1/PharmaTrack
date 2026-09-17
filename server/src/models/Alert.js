import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ['LOW_STOCK', 'EXPIRY_WARNING', 'EXPIRED_BATCH', 'SHIPMENT_DELAY', 'WAREHOUSE_CAPACITY', 'OUT_OF_STOCK'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    type: String,
    enum: ['Product', 'Batch', 'Shipment', 'Warehouse', 'System'],
    default: 'System'
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedEntityCode: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const Alert = mongoose.model('Alert', alertSchema);