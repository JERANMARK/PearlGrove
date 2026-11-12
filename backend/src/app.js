
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import zlib from 'zlib';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { getVerifiedImageType } from './utils/validation.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import prisma from './config/database.js';
import { getSupabaseAdmin } from './config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Structured Logger
const logger = {
  info: (message, meta = {}) => {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta,
    };
    console.log(JSON.stringify(logData));
  },
  error: (message, error = null, meta = {}) => {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
      ...meta,
    };
    console.error(JSON.stringify(logData));
  },
  warn: (message, meta = {}) => {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta,
    };
    console.warn(JSON.stringify(logData));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const logData = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        ...meta,
      };
      console.debug(JSON.stringify(logData));
    }
  },
};

const app = express();
app.set('trust proxy', 1);

// Request ID tracking middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security headers with CSP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    const apiOrigin = process.env.PUBLIC_API_URL || '';
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ];

    if (apiOrigin) {
      try {
        const apiUrl = new URL(apiOrigin);
        cspDirectives.push(`img-src 'self' data: blob: ${apiUrl.origin}`);
        cspDirectives.push(`connect-src 'self' ${apiUrl.origin}`);
      } catch (e) {
        logger.warn('Invalid PUBLIC_API_URL for CSP', { url: apiOrigin });
      }
    }

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  }

  next();
});

const publicImagesDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../public/images/uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldSize: 1024 * 1024,
    fields: 10,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/x-ms-bmp',
      'image/avif',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    const error = new Error('Only JPEG, PNG, WEBP, GIF, BMP, and AVIF images are allowed.');
    error.statusCode = 400;
    cb(error);
  },
});

// Production origins are explicit. Development origins are configured separately.
const configuredOrigins = (value) =>
  (value || '').split(',').map((origin) => origin.trim()).filter(Boolean);

const allowedOrigins = new Set(
  process.env.NODE_ENV === 'production'
    ? configuredOrigins(process.env.FRONTEND_URL)
    : configuredOrigins(process.env.DEV_ALLOWED_ORIGINS)
);

if (process.env.NODE_ENV === 'production' && allowedOrigins.size === 0) {
  throw new Error('FRONTEND_URL must contain at least one allowed origin in production.');
}

app.use((req, res, next) => {
  const origin = req.get('Origin');

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ success: false, error: 'Origin is not allowed.' });
  }

  const cookieAuthenticatedMutation =
    req.headers.cookie?.includes('pearl_admin_session=') &&
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method);

  if (cookieAuthenticatedMutation && (!origin || !allowedOrigins.has(origin))) {
    return res.status(403).json({
      success: false,
      error: 'A valid application origin is required for this request.',
    });
  }

  next();
});

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// Legacy local images route. New uploads use Supabase Storage.
app.use('/images/uploads', express.static(publicImagesDir));
app.use('/images', express.static(path.resolve(__dirname, '../../public/images')));

// Health Check API
app.get('/api/health', (req, res) => {
  logger.info('Health check requested', { requestId: req.id });

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Pearl Grow API',
    environment: process.env.NODE_ENV || 'development',
    requestId: req.id,
  });
});

// Health check with retry logic, exponential backoff, and caching
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let healthCheckCache = {
  status: 'unknown',
  lastCheck: 0,
  cacheDuration: 30000,
};

app.get('/api/ready', async (req, res) => {
  const now = Date.now();

  if (
    healthCheckCache.status !== 'unknown' &&
    now - healthCheckCache.lastCheck < healthCheckCache.cacheDuration
  ) {
    logger.debug('Using cached health check result', {
      requestId: req.id,
      status: healthCheckCache.status,
      age: now - healthCheckCache.lastCheck,
    });

    if (healthCheckCache.status === 'ready') {
      return res.json({
        status: 'ready',
        requestId: req.id,
        cached: true,
      });
    }

    return res.status(503).json({
      status: 'not_ready',
      requestId: req.id,
      cached: true,
    });
  }

  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;

      logger.info('Database ready check passed', {
        requestId: req.id,
        attempt,
      });

      healthCheckCache = {
        status: 'ready',
        lastCheck: now,
        cacheDuration: 30000,
      };

      return res.json({
        status: 'ready',
        requestId: req.id,
        cached: false,
      });
    } catch (error) {
      logger.warn('Database ready check failed', {
        requestId: req.id,
        attempt,
        maxRetries,
        error: error.message,
      });

      if (attempt === maxRetries) {
        logger.error('Database ready check failed after all retries', null, {
          requestId: req.id,
          totalAttempts: maxRetries,
        });

        healthCheckCache = {
          status: 'not_ready',
          lastCheck: now,
          cacheDuration: 30000,
        };

        return res.status(503).json({
          status: 'not_ready',
          requestId: req.id,
          error: 'Database connection failed',
          cached: false,
        });
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
});

// Upload images to Supabase Storage
app.post('/api/admin/upload-image', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please select an image file to upload.',
      });
    }

    const type = getVerifiedImageType(req.file.mimetype, req.file.buffer);

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file content does not match a supported image type.',
      });
    }

    const filename = `${randomUUID()}${type.extension}`;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

    const { data, error } = await getSupabaseAdmin()
      .storage
      .from(bucket)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicData } = getSupabaseAdmin()
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        imageUrl: publicData.publicUrl,
        filename,
      },
    });
  } catch (error) {
    logger.error('Supabase image upload failed', error, {
      requestId: req.id,
    });
    return next(error);
  }
});

// Mount Routes

app.use('/api/v1/admin', authRoutes);
app.use('/api/admin', authRoutes);

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', productRoutes);

app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/admin/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', categoryRoutes);

app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin/orders', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', orderRoutes);

app.use('/api/v1/admin/dashboard', dashboardRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/settings', settingsRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
