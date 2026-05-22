import type { RequestHandler } from 'express';
import { AppError } from '../lib/http.js';
import { verifyToken } from '../lib/jwt.js';

/** The authenticated user attached to the request by `requireAuth`. */
export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Guards protected routes. Accepts a Bearer token in the Authorization header
 * or a `token` cookie, verifies it, and attaches `req.user`.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer ?? (req.cookies?.token as string | undefined);

  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};
