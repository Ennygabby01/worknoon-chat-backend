import { z } from "zod";
import { objectIdSchema } from "../../shared/validation/object-id.js";
import { conversationTypes } from "./conversation.model.js";

export const createConversationSchema = z.object({
  participantIds: z.array(objectIdSchema).min(1).max(10),
  type: z.enum(conversationTypes).default("direct"),
  topic: z.string().trim().min(1).max(120).optional(),
  productContext: z
    .object({
      productId: z.string().trim().min(1).max(120).optional(),
      productName: z.string().trim().min(1).max(160).optional()
    })
    .optional()
});

export const createSupportConversationSchema = z.object({
  topic: z.string().trim().min(1).max(120).optional(),
  openingMessage: z.string().trim().min(1).max(2000),
  clientMessageId: z.string().trim().min(8).max(80),
  productContext: z
    .object({
      productId: z.string().trim().min(1).max(120).optional(),
      productName: z.string().trim().min(1).max(160).optional()
    })
    .optional()
});

export const conversationIdParamsSchema = z.object({
  id: objectIdSchema
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateSupportConversationInput = z.infer<typeof createSupportConversationSchema>;
export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
