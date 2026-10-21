import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct
} from '../controllers/productController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected Admin routes
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.patch('/:id/toggle-availability', authMiddleware, toggleProductAvailability);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;