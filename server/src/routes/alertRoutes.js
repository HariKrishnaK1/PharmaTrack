import express from 'express';
import {
  getAlerts,
  markAlertRead,
  resolveAlert,
  evaluateAlertsHandler,
  sendTestAlertEmailHandler
} from '../controllers/alertController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAlerts);
router.patch('/:id/read', markAlertRead);
router.patch('/:id/resolve', authorize('ADMIN', 'INVENTORY_MANAGER'), resolveAlert);
router.post('/evaluate', authorize('ADMIN', 'INVENTORY_MANAGER'), evaluateAlertsHandler);
router.post('/test-email', authorize('ADMIN'), sendTestAlertEmailHandler);

export default router;