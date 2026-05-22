import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** An error with an HTTP status, thrown anywhere and rendered by the error middleware. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Not allowed') {
    return new AppError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new AppError(409, message, 'CONFLICT');
  }
}

/**
 * Wraps an async route handler so thrown errors / rejected promises are
 * forwarded to Express's error middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
