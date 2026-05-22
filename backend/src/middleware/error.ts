import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/http.js';
import { env } from '../config/env.js';

/** 404 handler for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}`, code: 'NOT_FOUND' } });
};

/** Centralised error handler — maps known error types to clean JSON envelopes. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors as Record<string, string[]>,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { message: 'A record with this value already exists', code: 'CONFLICT' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { message: 'Record not found', code: 'NOT_FOUND' } });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: env.isProduction ? 'Internal server error' : String((err as Error)?.message ?? err),
      code: 'INTERNAL_ERROR',
    },
  });
};
