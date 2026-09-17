import express from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  getFefoRecommendationsHandler
} from '../controllers/batchController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBatches);
router.get('/fefo-recommendations/:productId', getFefoRecommendationsHandler);
router.get('/:id', getBatchById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), createBatch);
router.put('/:id', authorize('ADMIN', 'INVENTORY_MANAGER'), updateBatch);

export default router;