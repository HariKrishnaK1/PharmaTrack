import express from 'express';
import { handleAIQuery } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/query', handleAIQuery);

export default router;