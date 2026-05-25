import { Router } from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { presentUser } from "../users/user.presenter.js";
import { requireAuth } from "./auth.middleware.js";
import {
  confirmEmailVerificationSchema,
  loginSchema,
  registerSchema,
  requestEmailVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  type ConfirmEmailVerificationInput,
  type LoginInput,
  type RegisterInput,
  type RequestEmailVerificationInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput
} from "./auth.schemas.js";
import { clearRefreshCookie, getCookieValue, setRefreshCookie } from "./refresh-cookie.js";
import {
  confirmEmailVerification,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword
} from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.validatedBody as RegisterInput);
    clearRefreshCookie(res);

    res.status(201).json({
      user: result.user
    });
  })
);

authRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.validatedBody as LoginInput);
    setRefreshCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.accessToken
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = getCookieValue(req.headers.cookie, env.REFRESH_TOKEN_COOKIE_NAME);
    const result = await refreshUserSession(refreshToken);
    setRefreshCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.accessToken
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = getCookieValue(req.headers.cookie, env.REFRESH_TOKEN_COOKIE_NAME);
    await logoutUser(refreshToken);
    clearRefreshCookie(res);
    res.status(204).send();
  })
);

authRouter.post(
  "/email-verification/request",
  validateRequest({ body: requestEmailVerificationSchema }),
  asyncHandler(async (req, res) => {
    const result = await requestEmailVerification(
      req.validatedBody as RequestEmailVerificationInput
    );

    res.json(result);
  })
);

authRouter.post(
  "/email-verification/confirm",
  validateRequest({ body: confirmEmailVerificationSchema }),
  asyncHandler(async (req, res) => {
    const result = await confirmEmailVerification(
      req.validatedBody as ConfirmEmailVerificationInput
    );
    setRefreshCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.accessToken
    });
  })
);

authRouter.post(
  "/password-reset/request",
  validateRequest({ body: requestPasswordResetSchema }),
  asyncHandler(async (req, res) => {
    const result = await requestPasswordReset(req.validatedBody as RequestPasswordResetInput);

    res.json(result);
  })
);

authRouter.post(
  "/password-reset/confirm",
  validateRequest({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const result = await resetPassword(req.validatedBody as ResetPasswordInput);

    res.json(result);
  })
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({
    user: presentUser(req.user!)
  });
});
