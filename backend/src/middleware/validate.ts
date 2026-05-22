import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed,
 * typed result. Throws a ZodError on failure, handled by the error middleware.
 *
 * Query strings are validated directly in the controllers that need them
 * (`schema.parse(req.query)`), since Express's `req.query` is read-only in some
 * setups and doesn't tolerate reassignment from middleware.
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body) as z.infer<T>;
    next();
  };
}
