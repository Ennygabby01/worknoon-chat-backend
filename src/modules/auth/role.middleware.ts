import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import type { UserRole } from "../users/user-role.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication is required", 401, "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission for this action", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}
