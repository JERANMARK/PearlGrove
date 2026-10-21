import express from 'express';
import { login, logout, getMe, updatePassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = express.Router();

router.post('/login', loginRateLimit, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, updatePassword);

export default router;
