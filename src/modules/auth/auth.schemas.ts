import { z } from "zod";
import { publicRegistrationRoles } from "../users/user-role.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(publicRegistrationRoles).default("customer")
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});

export const requestEmailVerificationSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase())
});

export const confirmEmailVerificationSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  code: z.string().trim().regex(/^\d{6}$/)
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase())
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(128),
  password: z.string().min(8).max(128)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestEmailVerificationInput = z.infer<typeof requestEmailVerificationSchema>;
export type ConfirmEmailVerificationInput = z.infer<typeof confirmEmailVerificationSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
