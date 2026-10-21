import express from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings
} from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for frontend to read business info & whatsapp number
router.get('/public', getPublicSettings);

// Protected Admin routes
router.get('/', authMiddleware, getAdminSettings);
router.put('/', authMiddleware, updateAdminSettings);

export default router;
