import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  issues?: any[];
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');

  logger.error(`Unhandled error on ${req.method} ${req.url}:`, {
    code,
    message,
    statusCode,
    stack: config.isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.issues && { issues: err.issues }),
      ...(config.isDev && statusCode === 500 && { stack: err.stack }),
    },
  });
};
