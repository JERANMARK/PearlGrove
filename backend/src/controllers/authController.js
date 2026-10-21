import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { getJwtSecret } from '../config/jwt.js';
import { clearLoginRateLimit } from '../middleware/loginRateLimit.js';
import { getAdminSessionCookieOptions, isValidAdminPasswordLength, nextSessionVersion } from '../utils/validation.js';

const setSessionCookie = (res, token) => res.cookie('pearl_admin_session', token, getAdminSessionCookieOptions());

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim() || email.length > 254 || typeof password !== 'string' || !password || password.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      console.warn(JSON.stringify({ event: 'admin_login_failed', requestId: /^[a-zA-Z0-9._-]{1,80}$/.test(req.get('x-request-id') || '') ? req.get('x-request-id') : 'unassigned', reason: 'credentials_rejected' }));
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.warn(JSON.stringify({ event: 'admin_login_failed', requestId: /^[a-zA-Z0-9._-]{1,80}$/.test(req.get('x-request-id') || '') ? req.get('x-request-id') : 'unassigned', reason: 'credentials_rejected' }));
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, ver: admin.updatedAt.getTime() },
      getJwtSecret(),
      { expiresIn: '1h', algorithm: 'HS256' }
    );
    clearLoginRateLimit(req);
    setSessionCookie(res, token);

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  const { maxAge: _maxAge, ...clearCookieOptions } = getAdminSessionCookieOptions();
  res.clearCookie('pearl_admin_session', clearCookieOptions);
  try {
    await prisma.admin.update({ where: { id: req.adminId }, data: { updatedAt: nextSessionVersion(req.adminSessionVersion) } });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) { next(error); }
};

export const getMe = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found.',
      });
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
      });
    }

    if (!isValidAdminPasswordLength(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'New password must be between 12 and 72 bytes.',
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password does not match.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { password: hashedPassword },
    });

    console.info(JSON.stringify({ event: 'admin_password_changed' }));

    const { maxAge: _maxAge, ...clearCookieOptions } = getAdminSessionCookieOptions();
    res.clearCookie('pearl_admin_session', clearCookieOptions);

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
