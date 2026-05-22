import { z } from "zod";
import { objectIdSchema } from "../shared/validation/object-id.js";
import { createMessageSchema } from "../modules/messages/message.schemas.js";

export const joinConversationPayloadSchema = z.object({
  conversationId: objectIdSchema
});

export const sendMessagePayloadSchema = z.object({
  conversationId: objectIdSchema,
  body: createMessageSchema.shape.body,
  clientMessageId: createMessageSchema.shape.clientMessageId
});

export const typingPayloadSchema = z.object({
  conversationId: objectIdSchema
});

export type JoinConversationPayload = z.infer<typeof joinConversationPayloadSchema>;
export type SendMessagePayload = z.infer<typeof sendMessagePayloadSchema>;
export type TypingPayload = z.infer<typeof typingPayloadSchema>;
