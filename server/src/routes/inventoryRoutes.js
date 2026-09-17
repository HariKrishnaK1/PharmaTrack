import express from 'express';
import {
  getInventory,
  recordMovement,
  getMovements
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getInventory);
router.post('/movement', authorize('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'), recordMovement);
router.get('/movements', getMovements);

export default router;