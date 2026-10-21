import express from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { publicOrderRateLimit } from '../middleware/publicOrderRateLimit.js';

const router = express.Router();

// Public route for customer order / enquiry creation
router.post('/', publicOrderRateLimit, createOrder);

// Protected Admin routes
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrder);
router.put('/:id/status', authMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
