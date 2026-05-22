import bcrypt from "bcrypt";
import crypto from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import {
  sendEmailVerificationMail,
  sendPasswordResetMail
} from "../../shared/mail/mail.service.js";
import { UserModel } from "../users/user.model.js";
import { presentUser } from "../users/user.presenter.js";
import type { UserRole } from "../users/user-role.js";
import type {
  ConfirmEmailVerificationInput,
  LoginInput,
  RegisterInput,
  RequestEmailVerificationInput,
  RequestPasswordResetInput,
  ResetPasswordInput
} from "./auth.schemas.js";
import { AccountActionTokenModel } from "./account-action-token.model.js";
import { RefreshSessionModel } from "./refresh-session.model.js";
import {
  createRefreshToken,
  getAccessPayload,
  getRefreshExpiry,
  hashRefreshToken,
  signAccessToken
} from "./token.service.js";

const passwordHashRounds = 12;
const emailVerificationMinutes = 15;
const passwordResetMinutes = 30;

function createExpiresAt(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function createActionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function createSession(user: { _id: Types.ObjectId; role: UserRole }) {
  const refreshToken = createRefreshToken();

  await RefreshSessionModel.create({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshExpiry()
  });

  return {
    accessToken: signAccessToken(getAccessPayload(user)),
    refreshToken
  };
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await UserModel.exists({ email: input.email });

  if (existingUser) {
    throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_REGISTERED");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role
  });

  const session = await createSession(user);

  return {
    user: presentUser(user),
    ...session
  };
}

export async function loginUser(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const session = await createSession(user);

  return {
    user: presentUser(user),
    ...session
  };
}

export async function refreshUserSession(refreshToken: string | null) {
  if (!refreshToken) {
    throw new AppError("Refresh session is required", 401, "REFRESH_REQUIRED");
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const session = await RefreshSessionModel.findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    throw new AppError("Refresh session is invalid", 401, "INVALID_REFRESH_SESSION");
  }

  const user = await UserModel.findById(session.userId);

  if (!user) {
    throw new AppError("Refresh session is invalid", 401, "INVALID_REFRESH_SESSION");
  }

  session.revokedAt = new Date();
  await session.save();

  const nextSession = await createSession(user);

  return {
    user: presentUser(user),
    ...nextSession
  };
}

export async function logoutUser(refreshToken: string | null) {
  if (!refreshToken) {
    return;
  }

  await RefreshSessionModel.updateOne(
    {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: { $exists: false }
    },
    {
      $set: { revokedAt: new Date() }
    }
  );
}

export async function requestEmailVerification(input: RequestEmailVerificationInput) {
  const user = await UserModel.findOne({ email: input.email });

  if (!user || user.emailVerifiedAt) {
    return { sent: true };
  }

  const token = createActionToken();
  const code = createVerificationCode();

  await AccountActionTokenModel.create({
    userId: user._id,
    type: "email_verification",
    tokenHash: hashValue(token),
    codeHash: hashValue(code),
    expiresAt: createExpiresAt(emailVerificationMinutes)
  });

  await sendEmailVerificationMail({
    to: user.email,
    name: user.name,
    code
  });

  return {
    sent: true
  };
}

export async function confirmEmailVerification(input: ConfirmEmailVerificationInput) {
  const user = await UserModel.findOne({ email: input.email });

  if (!user) {
    throw new AppError("Verification code is invalid or expired", 400, "INVALID_VERIFICATION_CODE");
  }

  if (user.emailVerifiedAt) {
    return {
      user: presentUser(user)
    };
  }

  const token = await AccountActionTokenModel.findOne({
    userId: user._id,
    type: "email_verification",
    codeHash: hashValue(input.code),
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!token) {
    throw new AppError("Verification code is invalid or expired", 400, "INVALID_VERIFICATION_CODE");
  }

  token.consumedAt = new Date();
  user.emailVerifiedAt = new Date();

  await Promise.all([token.save(), user.save()]);

  return {
    user: presentUser(user)
  };
}

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  const user = await UserModel.findOne({ email: input.email });

  if (!user) {
    return { sent: true };
  }

  const token = createActionToken();

  await AccountActionTokenModel.create({
    userId: user._id,
    type: "password_reset",
    tokenHash: hashValue(token),
    expiresAt: createExpiresAt(passwordResetMinutes)
  });

  await sendPasswordResetMail({
    to: user.email,
    name: user.name,
    token
  });

  return {
    sent: true
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const token = await AccountActionTokenModel.findOne({
    type: "password_reset",
    tokenHash: hashValue(input.token),
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!token) {
    throw new AppError("Reset link is invalid or expired", 400, "INVALID_RESET_TOKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);

  await Promise.all([
    UserModel.updateOne({ _id: token.userId }, { $set: { passwordHash } }),
    RefreshSessionModel.updateMany(
      { userId: token.userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ),
    AccountActionTokenModel.updateOne(
      { _id: token._id },
      { $set: { consumedAt: new Date() } }
    )
  ]);

  return { reset: true };
}
