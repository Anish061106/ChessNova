import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './utils/config.js';
import { apiRouter } from './routes/api.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { apiRateLimiter } from './middleware/apiRateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

export const createApp = () => {
  const app = express();

  // Security HTTP Headers
  app.use(securityHeaders);

  // CORS configuration
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // General API rate limiting
  app.use('/api', apiRateLimiter);

  // API Routes prefix
  app.use('/api', apiRouter);

  // 404 Fallback for unmatched API routes
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

