import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';

/**
 * Guards /api/internal/* routes used by the task executor. The executor presents
 * the shared INTERNAL_API_TOKEN in the `x-internal-token` header. These routes
 * are the executor's only way to read/write data — it has no DB access.
 */
export const requireInternalToken: RequestHandler = (req, _res, next) => {
  const token = req.header('x-internal-token');
  if (!token || token !== env.INTERNAL_API_TOKEN) {
    next(AppError.forbidden('Invalid internal token'));
    return;
  }
  next();
};
