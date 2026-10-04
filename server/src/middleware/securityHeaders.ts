import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config.js';

/**
 * Security headers middleware
 * Enforces defense-in-depth HTTP response headers against clickjacking, MIME-sniffing, XSS, and information leakage.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Disallow framing to protect against clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable legacy browser XSS filters
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent in outbound requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict unused browser device features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Remove X-Powered-By header to avoid framework fingerprinting
  res.removeHeader('X-Powered-By');

  // Enforce HTTPS in production via Strict-Transport-Security
  if (config.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

