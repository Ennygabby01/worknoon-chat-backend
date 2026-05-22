import type { Types } from "mongoose";
import type { MessageDocument } from "./message.model.js";

export function presentMessage(message: MessageDocument) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId.toString(),
    body: message.body,
    clientMessageId: message.clientMessageId,
    readBy: message.readBy.map((userId: Types.ObjectId) => userId.toString()),
    createdAt: message.createdAt?.toISOString(),
    updatedAt: message.updatedAt?.toISOString()
  };
}
