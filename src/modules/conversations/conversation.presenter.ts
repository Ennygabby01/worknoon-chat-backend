import type { ConversationDocument } from "./conversation.model.js";

export function presentConversation(
  conversation: ConversationDocument,
  lastMessageBody?: string | null
) {
  return {
    id: conversation._id.toString(),
    type: conversation.type,
    status: conversation.status ?? "open",
    assignedAgentId: conversation.assignedAgentId?.toString() ?? null,
    participants: conversation.participants.map((participant) => ({
      userId: participant.userId.toString(),
      readAt: participant.readAt?.toISOString() ?? null
    })),
    topic: conversation.topic ?? null,
    productContext: conversation.productContext ?? null,
    lastMessageId: conversation.lastMessageId?.toString() ?? null,
    lastMessageBody: lastMessageBody ?? null,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    createdAt: conversation.createdAt?.toISOString(),
    updatedAt: conversation.updatedAt?.toISOString()
  };
}
