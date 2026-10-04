import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter to prevent denial of service and API flooding
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 5000 : 500, // Allow up to 500 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP. Please slow down and try again later.',
    },
  },
});
