import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse
} from '../controllers/warehouseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', authorize('ADMIN'), createWarehouse);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE_MANAGER'), updateWarehouse);

export default router;