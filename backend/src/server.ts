import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { app } from './app';
import { logger } from './utils/logger';
import { runDataCleanup } from './jobs/data-cleanup';

const PORT = env.PORT;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Schedule daily data cleanup job (DPDP Act compliance)
    const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
    setTimeout(() => {
      runDataCleanup().catch((err) =>
        logger.error({ err }, 'Initial data cleanup run failed')
      );
    }, 30_000);
    const cleanupInterval = setInterval(() => {
      runDataCleanup().catch((err) =>
        logger.error({ err }, 'Scheduled data cleanup run failed')
      );
    }, CLEANUP_INTERVAL_MS);

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      clearInterval(cleanupInterval);
      server.close(async () => {
        await disconnectDB();
        logger.info('Server shut down');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
