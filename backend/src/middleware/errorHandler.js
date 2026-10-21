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
};

export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || req.get('x-request-id') || 'unassigned';
  const safeCode = typeof err.code === 'string' && /^[A-Z0-9_]{1,24}$/.test(err.code) ? err.code : 'UNCLASSIFIED';
  
  logger.error('Request error occurred', err, {
    requestId,
    code: safeCode,
    errorType: err.name === 'PrismaClientKnownRequestError' ? 'database_error' : 'server_error',
    path: req.path,
    method: req.method,
  });

  if (multerError(err)) return res.status(400).json({ success: false, error: 'The uploaded file is invalid or exceeds the allowed size.' });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'A record with one of these values already exists.',
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Requested record was not found.',
    });
  }

  // Generic status / internal server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.statusCode || err.status ? err.message : 'An unexpected internal error occurred.';

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : message,
    requestId,
  });
};

export const notFoundHandler = (req, res) => {
  const requestId = req.id || req.get('x-request-id') || 'unassigned';
  logger.warn('Endpoint not found', {
    requestId,
    path: req.path,
    method: req.method,
  });
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
    requestId,
  });
};

function multerError(err) {
  return err?.name === 'MulterError' || err?.code === 'LIMIT_FILE_SIZE';
}
