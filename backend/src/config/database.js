import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Configure connection pool and timeouts
// Prisma defaults: 10 connections, 30 second query timeout
// These settings are optimized for production with higher loads
const connectionPoolConfig = {
  // Connection pool size - adjust based on your DB tier
  // Free tiers usually support 10-25 connections
  connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  
  // How long to wait for a connection from the pool (ms)
  connection_timeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  
  // Query timeout - how long a query can run before being cancelled (ms)
  // Default Prisma behavior applies if not set
};

// Apply configuration if using pool explicitly
// Note: Prisma manages connection pool internally; these are hints
if (process.env.NODE_ENV === 'production') {
  // In production, we want to ensure connection pooling is healthy
  prisma.$connect()
    .then(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Database connected successfully',
      }));
    })
    .catch((error) => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Database connection failed',
        error: error.message,
      }));
      process.exit(1);
    });
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Received ${signal}, closing database connection...`,
  }));
  
  try {
    await prisma.$disconnect();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Database connection closed',
    }));
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Error closing database connection',
      error: error.message,
    }));
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default prisma;