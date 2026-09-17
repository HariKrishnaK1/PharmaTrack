import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic chemical name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Tablets', 'Capsules', 'Syrups', 'Injectables', 'Creams', 'Devices', 'Inhalers', 'Supplements'],
    default: 'Tablets',
    index: true
  },
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    trim: true
  },
  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  unitOfMeasure: {
    type: String,
    required: true,
    default: 'Packs'
  },
  minimumStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative'],
    default: 100
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 200
  },
  unitPrice: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    default: 15.00
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISCONTINUED'],
    default: 'ACTIVE',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Product = mongoose.model('Product', productSchema);