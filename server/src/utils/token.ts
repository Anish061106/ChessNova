import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

const JWT_EXPIRES_IN = '7d';

/**
 * Signs a secure JWT authentication token
 */
export function signAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a JWT authentication token
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (decoded && decoded.userId) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
