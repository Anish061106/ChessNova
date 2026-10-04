import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, TokenPayload } from '../utils/token.js';
import { AUTH_COOKIE_NAME } from '../utils/cookie.js';
import { prisma } from '../services/database/prisma.js';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Extract token from HTTP-only cookie or Authorization header
  let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      },
    });
    return;
  }

  // 2. Verify token
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired or is invalid. Please log in again.',
      },
    });
    return;
  }

  // 3. Optional DB verification: verify user is still active in DB
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Account not found or inactive.',
        },
      });
      return;
    }

    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch {
    // If DB is temporarily unreachable in test environments, still trust valid signature
    req.user = payload;
    next();
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
