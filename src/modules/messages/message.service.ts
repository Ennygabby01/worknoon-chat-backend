import { AppError } from "../../shared/errors/app-error.js";
import { ConversationModel, type ConversationDocument } from "../conversations/conversation.model.js";
import { assertConversationMember } from "../conversations/conversation.service.js";
import { MessageModel } from "./message.model.js";
import type { CreateMessageInput, MessageListQuery } from "./message.schemas.js";

type CreateConversationMessageOptions = {
  senderKind?: "user" | "assistant";
  senderName?: string;
  createdAt?: Date;
};

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  query: MessageListQuery
) {
  await assertConversationMember(conversationId, userId);

  return MessageModel.find({
    conversationId,
    ...(query.before ? { createdAt: { $lt: new Date(query.before) } } : {})
  })
    .sort({ createdAt: -1 })
    .limit(query.limit);
}

export async function createConversationMessage(
  conversation: ConversationDocument,
  senderId: string,
  input: CreateMessageInput,
  options: CreateConversationMessageOptions = {}
) {
  const existingMessage = await MessageModel.findOne({
    conversationId: conversation._id,
    senderId,
    clientMessageId: input.clientMessageId
  });

  if (existingMessage) {
    return existingMessage;
  }

  try {
    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId,
      senderKind: options.senderKind ?? "user",
      senderName: options.senderName,
      body: input.body,
      clientMessageId: input.clientMessageId,
      readBy: options.senderKind === "assistant" ? [] : [senderId],
      createdAt: options.createdAt,
      updatedAt: options.createdAt
    });

    await ConversationModel.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageId: message._id,
          lastMessageAt: message.createdAt
        }
      }
    );

    return message;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      const message = await MessageModel.findOne({
        conversationId: conversation._id,
        senderId,
        clientMessageId: input.clientMessageId
      });

      if (message) {
        return message;
      }
    }

    throw error;
  }
}

export async function markMessagesRead(conversationId: string, userId: string) {
  const conversation = await assertConversationMember(conversationId, userId);

  await MessageModel.updateMany(
    {
      conversationId,
      readBy: { $ne: userId }
    },
    {
      $addToSet: {
        readBy: userId
      }
    }
  );

  return conversation;
}

export function assertMessageBodyAllowed(body: string) {
  if (body.includes("<") || body.includes(">")) {
    throw new AppError("Messages must be plain text", 400, "MESSAGE_HTML_NOT_ALLOWED");
  }
}
