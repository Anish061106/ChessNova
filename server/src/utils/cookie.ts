import { Response, CookieOptions } from 'express';
import { config } from './config.js';

export const AUTH_COOKIE_NAME = 'chessnova_token';

export const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
});

/**
 * Sets the HTTP-only authentication cookie on the response
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

/**
 * Clears the HTTP-only authentication cookie on logout
 */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
}
