import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';
import type { Request } from 'express';

const makeStore = (prefix: string) =>
  new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) =>
      redis.call(args[0] as never, ...args.slice(1)) as Promise<any>,
  });

const errorResponse = (message: string) => ({
  success: false,
  error: { message, code: 'RATE_LIMIT_EXCEEDED' },
});

/**
 * Global — every route: 300 requests / 15 min per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('global'),
  message: errorResponse('Too many requests, please try again later.'),
});

/**
 * Auth — login & register: 10 requests / 15 min per IP
 * Prevents brute-force and spam account creation.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('auth'),
  message: errorResponse('Too many attempts. Please try again in 15 minutes.'),
});

/**
 * Refresh token — 20 requests / 15 min per IP
 * Slightly looser than auth to accommodate mobile clients.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('refresh'),
  message: errorResponse('Too many token refresh attempts. Please try again later.'),
});

/**
 * File upload — 5 uploads / 1 hour per user (falls back to IP for unauthenticated requests)
 * Prevents Cloudinary abuse.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('upload'),
  keyGenerator: (req: Request) =>
    (req.user as any)?.userId ?? ipKeyGenerator(req.ip ?? ''),
  message: errorResponse('Upload limit reached. You can upload up to 5 documents per hour.'),
});

/**
 * Campaign send — 5 sends / 1 hour per admin user
 * Prevents accidental or malicious bulk email floods.
 */
export const campaignSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('campaign-send'),
  keyGenerator: (req: Request) =>
    (req.user as any)?.userId ?? ipKeyGenerator(req.ip ?? ''),
  message: errorResponse('Campaign send limit reached. Please wait before sending more emails.'),
});

/**
 * Heavy reads — stats & reports: 60 requests / 15 min per user
 * Protects expensive DB aggregation queries.
 */
export const heavyReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('heavy-read'),
  keyGenerator: (req: Request) =>
    (req.user as any)?.userId ?? ipKeyGenerator(req.ip ?? ''),
  message: errorResponse('Too many requests for this resource. Please try again later.'),
});
