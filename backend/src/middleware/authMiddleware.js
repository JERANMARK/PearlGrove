import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt.js';
import prisma from '../config/database.js';

const readCookie = (header, name) => {
  const item = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : readCookie(req.headers.cookie, 'pearl_admin_session');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (!decoded.id) throw new Error('Token subject is missing.');
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id }, select: { updatedAt: true } });
    if (!admin || decoded.ver !== admin.updatedAt.getTime()) throw new Error('Session is no longer valid.');
    req.adminId = decoded.id;
    req.adminSessionVersion = admin.updatedAt.getTime();
    next();
  } catch (error) {
    if (error.message?.startsWith('JWT_SECRET must be')) {
      return res.status(503).json({ success: false, error: 'Authentication is not configured.' });
    }
    if (error.name?.startsWith('PrismaClient')) return res.status(503).json({ success: false, error: 'Authentication service is temporarily unavailable.' });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
        isExpired: true,
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.',
    });
  }
};
