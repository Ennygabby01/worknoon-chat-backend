import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

const methodsWithBody = new Set(["POST", "PUT", "PATCH"]);

export const requireJsonContent: RequestHandler = (req, _res, next) => {
  if (!methodsWithBody.has(req.method)) {
    next();
    return;
  }

  if (!req.headers["content-length"] && !req.headers["transfer-encoding"]) {
    next();
    return;
  }

  if (req.is("application/json")) {
    next();
    return;
  }

  next(new AppError("Content-Type must be application/json", 415, "UNSUPPORTED_MEDIA_TYPE"));
};
