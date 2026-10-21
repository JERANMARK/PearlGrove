import path from 'node:path';
import { createHash } from 'node:crypto';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MONEY_CENTS = 999_999_999_999; // MySQL DECIMAL(12,2)

export const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const isText = (value, { required = false, max = 255 } = {}) =>
  typeof value === 'string' && (!required || value.trim().length > 0) && value.trim().length <= max;

export const parseMoney = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string' && !(value && typeof value.toFixed === 'function')) return null;
  const normalized = (typeof value === 'object' ? value.toFixed() : String(value)).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_MONEY_CENTS ? cents : null;
};

export const formatMoney = (cents) => {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_MONEY_CENTS) throw new TypeError('Money is outside the supported DECIMAL(12,2) range.');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
};

export const createOrderPayloadHash = (payload) =>
  createHash('sha256').update(JSON.stringify(canonicalize(payload)), 'utf8').digest('hex');

export const isValidIdempotencyKey = (value) =>
  typeof value === 'string' && value.length >= 16 && value.length <= 128 && /^[A-Za-z0-9._~-]+$/.test(value);

export const resolveIdempotentOrder = (existing, payloadHash) => {
  if (!existing) return { kind: 'new' };
  return existing.payloadHash === payloadHash
    ? { kind: 'replay', order: existing }
    : { kind: 'conflict' };
};

export const calculateOrderTotals = (lines) => {
  let totalCents = 0;
  const pricedLines = [];
  for (const { price, quantity } of lines) {
    const unitCents = parseMoney(price);
    if (unitCents === null || !Number.isSafeInteger(quantity) || quantity < 1) return null;
    const subtotalCents = unitCents * quantity;
    if (!Number.isSafeInteger(subtotalCents) || !Number.isSafeInteger(totalCents + subtotalCents) || totalCents + subtotalCents > MAX_MONEY_CENTS) return null;
    totalCents += subtotalCents;
    pricedLines.push({ unitCents, subtotalCents });
  }
  return { totalCents, pricedLines };
};

export const nextSessionVersion = (currentVersion, now = Date.now()) =>
  new Date(Math.max(now, currentVersion + 1));

export const isValidAdminPasswordLength = (value) =>
  typeof value === 'string' && Buffer.byteLength(value, 'utf8') >= 12 && Buffer.byteLength(value, 'utf8') <= 72;

export const getAdminSessionCookieOptions = (production = process.env.NODE_ENV === 'production') => ({
  httpOnly: true,
  secure: production,
  sameSite: production ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,
  path: '/api',
});

export const validateProductionConfig = (env) => {
  if (env.NODE_ENV !== 'production') return [];
  const errors = [];
  try {
    const databaseUrl = new URL(env.DATABASE_URL || '');
    const hostname = databaseUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    const isLoopback = hostname === 'localhost'
      || hostname.endsWith('.localhost')
      || hostname === '::1'
      || hostname === '::'
      || hostname === '0.0.0.0'
      || /^127(?:\.\d{1,3}){3}$/.test(hostname);
    if (databaseUrl.protocol !== 'mysql:' || !hostname || isLoopback || databaseUrl.pathname.length < 2 || !databaseUrl.username || !databaseUrl.password) errors.push('DATABASE_URL must point to a non-local MySQL database, include a database name, and contain credentials.');
  } catch { errors.push('DATABASE_URL must be a valid MySQL connection URL.'); }
  const origins = (env.FRONTEND_URL || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (origins.length === 0 || origins.some((value) => {
    try {
      const url = new URL(value);
      return url.protocol !== 'https:' || url.origin !== value || url.username || url.password;
    } catch { return true; }
  })) errors.push('FRONTEND_URL must contain only exact HTTPS origins.');
  return errors;
};

export const validateProductionUploadConfig = ({ nodeEnv, uploadsDir, publicApiUrl, persistent }) => {
  if (nodeEnv !== 'production') return true;
  if (persistent !== 'true' || typeof uploadsDir !== 'string' || !uploadsDir.trim() || !path.isAbsolute(uploadsDir)) return false;
  try {
    const url = new URL(publicApiUrl || '');
    return url.protocol === 'https:' && url.origin === publicApiUrl && !url.username && !url.password;
  } catch { return false; }
};


export const validOptionalBoolean = (value) => value === undefined || typeof value === 'boolean';

export const getVerifiedImageType = (mimeType, buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;
  const types = {
    'image/jpeg': { extension: '.jpg', valid: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    'image/png': { extension: '.png', valid: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
    'image/webp': { extension: '.webp', valid: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  };
  const type = types[mimeType];
  return type?.valid(buffer) ? type : null;
};

// Simple schema validation helpers (Zod alternative)
export const validateSchema = (data, schema) => {
  const errors = [];
  const validated = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }
    
    if (value === undefined || value === null || value === '') {
      if (!rules.required) continue;
    }
    
    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${key} must be a string`);
        continue;
      }
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`);
      }
      validated[key] = value.trim();
    }
    
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${key} must be a number`);
        continue;
      }
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`${key} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`${key} must be at most ${rules.max}`);
      }
      if (rules.integer && !Number.isInteger(num)) {
        errors.push(`${key} must be an integer`);
      }
      validated[key] = num;
    }
    
    if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`${key} must be a boolean`);
        continue;
      }
      validated[key] = value;
    }
    
    if (rules.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailRegex.test(value.trim())) {
        errors.push(`${key} must be a valid email`);
        continue;
      }
      validated[key] = value.trim().toLowerCase();
    }
    
    if (rules.type === 'phone') {
      const cleaned = String(value).replace(/[^0-9]/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        errors.push(`${key} must be a valid phone number`);
        continue;
      }
      validated[key] = cleaned;
    }
    
    if (rules.custom && !rules.custom(value)) {
      errors.push(`${key} is invalid`);
      continue;
    }
  }
  
  return { valid: errors.length === 0, errors, data: validated };
};

// Input sanitization for display (basic XSS prevention)
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

