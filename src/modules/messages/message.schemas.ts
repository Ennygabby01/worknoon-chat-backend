import { z } from "zod";
import { objectIdSchema } from "../../shared/validation/object-id.js";

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  clientMessageId: z.string().trim().min(8).max(80)
});

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional()
});

export const conversationMessageParamsSchema = z.object({
  conversationId: objectIdSchema
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type ConversationMessageParams = z.infer<typeof conversationMessageParamsSchema>;
