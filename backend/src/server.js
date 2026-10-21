import app from './app.js';
import prisma from './config/database.js';
import { getJwtSecret } from './config/jwt.js';
import { validateProductionConfig } from './utils/validation.js';

// Refuse to start if signing and verification cannot use a strong configured secret.
getJwtSecret();
const productionConfigErrors = validateProductionConfig(process.env);
if (productionConfigErrors.length > 0) throw new Error(productionConfigErrors.join(' '));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Pearl Grow Backend API Server Started',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/api/health`,
  }));
});

// Graceful shutdown with timeout
const shutdown = async (signal) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Received ${signal}, initiating graceful shutdown...`,
  }));
  
  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Error closing server',
        error: err.message,
      }));
      process.exit(1);
    }
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Server stopped accepting new connections',
    }));
    
    // Give in-flight requests time to complete (10 seconds)
    const shutdownTimeout = setTimeout(() => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Graceful shutdown timeout, forcing exit',
      }));
      process.exit(1);
    }, 10000);
    
    try {
      await prisma.$disconnect();
      clearTimeout(shutdownTimeout);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Database disconnected gracefully',
      }));
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Graceful shutdown completed',
      }));
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimeout);
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Error disconnecting database',
        error: error.message,
      }));
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: 'Uncaught Exception',
    error: error.message,
    stack: error.stack,
  }));
  shutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: 'Unhandled Promise Rejection',
    reason: String(reason),
  }));
  shutdown('UNHANDLED_REJECTION');
});
