import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  uploadBatchDocument,
  deleteBatchDocument,
  uploadShipmentDocument,
  deleteShipmentDocument,
} from '../controllers/documentController.js';

const router = express.Router();
router.use(authenticate);

// Batch document routes
router.post(
  '/batches/:id/documents',
  authorize('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'),
  upload.single('document'),
  uploadBatchDocument
);
router.delete(
  '/batches/:id/documents/:docId',
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  deleteBatchDocument
);

// Shipment document routes
router.post(
  '/shipments/:id/documents',
  authorize('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'),
  upload.single('document'),
  uploadShipmentDocument
);
router.delete(
  '/shipments/:id/documents/:docId',
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  deleteShipmentDocument
);

export default router;
