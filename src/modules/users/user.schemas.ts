import { z } from "zod";
import { paginationQuerySchema } from "../../shared/validation/pagination.js";
import { userRoles } from "./user-role.js";

const contactRoles = ["agent", "customer", "designer", "merchant"] as const;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().trim().url().max(500).nullable().optional(),
    bio: z.string().trim().max(240).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required"
  });

export const userListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(userRoles).optional(),
  search: z.string().trim().min(1).max(80).optional()
});

export const contactListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(contactRoles).optional(),
  search: z.string().trim().min(1).max(80).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type ContactListQuery = z.infer<typeof contactListQuerySchema>;
