import mongoose from 'mongoose';

const shipmentItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Item quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    default: 0
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: [true, 'Shipment ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Source warehouse is required'],
    index: true
  },
  destination: {
    facilityName: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: '' }
  },
  carrier: {
    type: String,
    required: [true, 'Logistics carrier is required'],
    trim: true
  },
  temperatureRequirement: {
    type: String,
    enum: ['Controlled Room Temperature (15°C - 25°C)', 'Cold Chain (2°C - 8°C)', 'Frozen (-20°C)', 'Ambient'],
    default: 'Controlled Room Temperature (15°C - 25°C)'
  },
  items: [shipmentItemSchema],
  dispatchDate: {
    type: Date,
    default: null
  },
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Expected delivery date is required'],
    index: true
  },
  actualDeliveryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Shipment = mongoose.model('Shipment', shipmentSchema);