import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed,
 * typed result. Throws a ZodError on failure, handled by the error middleware.
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body) as z.infer<T>;
    next();
  };
}

/** Validates and coerces `req.query` against a Zod schema. */
export function validateQuery<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    res_locals_query(req, schema.parse(req.query));
    next();
  };
}

// Express 4 makes req.query a getter-only property in some setups; stash the
// validated query on res.locals to avoid reassignment errors.
function res_locals_query(req: { query: unknown }, value: unknown) {
  (req as { validatedQuery?: unknown }).validatedQuery = value;
  req.query = value as typeof req.query;
}
