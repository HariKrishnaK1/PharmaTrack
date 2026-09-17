import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'INVENTORY_MANAGER'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router;