import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { publicRoutes } from './routes/public.routes';
import { paymentRoutes } from './routes/payment.routes';
import { adminRoutes } from './routes/admin.routes';
import { customerRoutes } from './routes/customer.routes';
import { uploadRoutes } from './routes/upload.routes';
import { termsRoutes } from './routes/terms.routes';
import { paymentInfoRoutes } from './routes/payment-info.routes';

const app = express();

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
// Webhook must get raw body for HMAC-SHA256 verification — apply raw parser before any other body consumer
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
// JSON for all other routes
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    return next(); // already parsed as raw above; path is pathname-only so query params don't break skip
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(mongoSanitize());
app.use(hpp());
app.use(apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', publicRoutes);
app.use('/api', termsRoutes);
app.use('/api', paymentInfoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export { app };
