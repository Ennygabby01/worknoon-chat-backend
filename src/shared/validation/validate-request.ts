import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type RequestSchemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.validatedBody = schemas.body.parse(req.body) as unknown;
    }

    if (schemas.params) {
      req.validatedParams = schemas.params.parse(req.params) as unknown;
    }

    if (schemas.query) {
      req.validatedQuery = schemas.query.parse(req.query) as unknown;
    }

    next();
  };
}
