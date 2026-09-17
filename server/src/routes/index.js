import express from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import batchRoutes from './batchRoutes.js';
import warehouseRoutes from './warehouseRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import alertRoutes from './alertRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import auditRoutes from './auditRoutes.js';
import userRoutes from './userRoutes.js';
import aiRoutes from './aiRoutes.js';
import searchRoutes from './searchRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/batches', batchRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/search', searchRoutes);

export default router;