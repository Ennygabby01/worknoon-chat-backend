import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { UserModel } from "../users/user.model.js";
import { verifyAccessToken } from "./token.service.js";

const authenticateRequest = async (req: Parameters<RequestHandler>[0]) => {
  try {
    const authorization = req.header("authorization");

    if (!authorization) {
      throw new AppError("Authentication is required", 401, "AUTH_REQUIRED");
    }

    const [scheme, token, extra] = authorization.split(" ");

    if (scheme !== "Bearer" || !token || extra) {
      throw new AppError("Authorization header is invalid", 401, "INVALID_AUTH_HEADER");
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user) {
      throw new AppError("Authentication is invalid", 401, "INVALID_AUTH_TOKEN");
    }

    req.user = user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Authentication is invalid", 401, "INVALID_AUTH_TOKEN");
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  void authenticateRequest(req).then(() => next(), next);
};
