import { z } from "zod";
import { objectIdSchema } from "../../shared/validation/object-id.js";
import { paginationQuerySchema } from "../../shared/validation/pagination.js";
import { conversationTypes } from "../conversations/conversation.model.js";
import { userRoles } from "../users/user-role.js";

export const adminConversationListQuerySchema = paginationQuerySchema.extend({
  type: z.enum(conversationTypes).optional()
});

export const adminUserIdParamsSchema = z.object({
  id: objectIdSchema
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(userRoles).optional(),
  banned: z.boolean().optional()
}).refine((v) => v.role !== undefined || v.banned !== undefined, {
  message: "At least one field is required"
});

export type AdminConversationListQuery = z.infer<typeof adminConversationListQuerySchema>;
export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
