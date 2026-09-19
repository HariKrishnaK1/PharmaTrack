import { Batch } from '../models/Batch.js';
import { Shipment } from '../models/Shipment.js';
import { cloudinary } from '../middleware/uploadMiddleware.js';
import { config } from '../config/env.js';
import path from 'path';

// Helper: build file URL for local storage
const buildFileUrl = (req, file) => {
  if (file.path && file.path.startsWith('http')) return file.path; // Cloudinary URL
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
};

// ─── Batch Documents ──────────────────────────────────────────────────────────

export const uploadBatchDocument = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const doc = {
      name: req.body.name || req.file.originalname,
      url: buildFileUrl(req, req.file),
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    batch.documents = batch.documents || [];
    batch.documents.push(doc);
    await batch.save();

    res.status(200).json({ success: true, message: 'Document uploaded successfully.', document: doc });
  } catch (err) {
    next(err);
  }
};

export const deleteBatchDocument = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const docIndex = batch.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ success: false, message: 'Document not found.' });

    // Try to delete from Cloudinary if applicable
    const doc = batch.documents[docIndex];
    if (doc.url && doc.url.includes('cloudinary')) {
      const publicId = doc.url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
    }

    batch.documents.splice(docIndex, 1);
    await batch.save();

    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Shipment Documents ───────────────────────────────────────────────────────

export const uploadShipmentDocument = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const doc = {
      name: req.body.name || req.file.originalname,
      url: buildFileUrl(req, req.file),
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    shipment.documents = shipment.documents || [];
    shipment.documents.push(doc);
    await shipment.save();

    res.status(200).json({ success: true, message: 'Document uploaded successfully.', document: doc });
  } catch (err) {
    next(err);
  }
};

export const deleteShipmentDocument = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    const docIndex = shipment.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ success: false, message: 'Document not found.' });

    const doc = shipment.documents[docIndex];
    if (doc.url && doc.url.includes('cloudinary')) {
      const publicId = doc.url.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
    }

    shipment.documents.splice(docIndex, 1);
    await shipment.save();

    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
};
