import { z } from "zod";
import { paginationQuerySchema } from "../../shared/validation/pagination.js";
import { userRoles } from "./user-role.js";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().trim().url().max(500).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required"
  });

export const userListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(userRoles).optional(),
  search: z.string().trim().min(1).max(80).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
