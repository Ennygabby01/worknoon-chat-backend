import type { Response } from "express";
import { env } from "../../config/env.js";

const refreshCookiePath = "/api/v1/auth";

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: refreshCookiePath,
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: refreshCookiePath
  });
}

export function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
