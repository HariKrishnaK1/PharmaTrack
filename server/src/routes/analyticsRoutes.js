import express from 'express';
import {
  getDashboardSummary,
  getAdvancedAnalytics
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboardSummary);
router.get('/reports', getAdvancedAnalytics);

export default router;