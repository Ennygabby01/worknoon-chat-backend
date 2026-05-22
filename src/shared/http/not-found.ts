import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, "ROUTE_NOT_FOUND"));
};
