import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', globalSearch);

export default router;