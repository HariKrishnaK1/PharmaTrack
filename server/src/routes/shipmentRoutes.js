import express from 'express';
import {
  getShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus
} from '../controllers/shipmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getShipments);
router.get('/:id', getShipmentById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), createShipment);
router.patch('/:id/status', authorize('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'), updateShipmentStatus);

export default router;