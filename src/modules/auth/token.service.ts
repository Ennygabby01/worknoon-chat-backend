import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Types } from "mongoose";
import { env } from "../../config/env.js";
import type { UserRole } from "../users/user-role.js";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload & jwt.JwtPayload;
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);
  return expiresAt;
}

export function getAccessPayload(user: { _id: Types.ObjectId; role: UserRole }) {
  return {
    sub: user._id.toString(),
    role: user.role
  };
}
