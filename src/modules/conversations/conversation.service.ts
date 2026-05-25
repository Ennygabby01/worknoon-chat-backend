import { Types } from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { UserModel } from "../users/user.model.js";
import {
  ConversationModel,
  type ConversationDocument,
  type ConversationType
} from "./conversation.model.js";
import type { CreateConversationInput } from "./conversation.schemas.js";

export async function escalateConversation(conversationId: string, userId: string) {
  const conversation = await assertConversationMember(conversationId, userId);
  if (conversation.status !== "open") {
    throw new AppError("Conversation is not open", 400, "INVALID_STATUS");
  }
  conversation.status = "escalated";
  await conversation.save();
  return conversation;
}

export async function claimConversation(conversationId: string, agentId: string) {
  const updated = await ConversationModel.findOneAndUpdate(
    { _id: conversationId, status: "escalated", assignedAgentId: { $exists: false } },
    { status: "assigned", assignedAgentId: new Types.ObjectId(agentId) },
    { new: true }
  );
  if (!updated) {
    throw new AppError("Conversation is not available to claim", 409, "ALREADY_CLAIMED");
  }
  return updated;
}

export async function resolveConversation(conversationId: string, agentId: string) {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    assignedAgentId: new Types.ObjectId(agentId)
  });
  if (!conversation) {
    throw new AppError("Conversation not found or not assigned to you", 404, "NOT_FOUND");
  }
  conversation.status = "resolved";
  await conversation.save();
  return conversation;
}

export async function listEscalatedQueue() {
  return ConversationModel.find({ status: "escalated" }).sort({ updatedAt: -1 });
}

export async function listAgentCases(agentId: string) {
  return ConversationModel.find({
    assignedAgentId: new Types.ObjectId(agentId),
    status: { $in: ["assigned", "resolved"] }
  }).sort({ updatedAt: -1 });
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function getParticipantKey(type: ConversationType, participantIds: string[]) {
  if (type !== "direct") {
    return undefined;
  }

  return `direct:${[...participantIds].sort().join(":")}`;
}

export async function assertConversationMember(conversationId: string, userId: string) {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    "participants.userId": userId
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
  }

  return conversation;
}

export async function listConversationsForUser(userId: string) {
  return ConversationModel.find({ "participants.userId": userId }).sort({ updatedAt: -1 });
}

export async function createConversation(userId: string, input: CreateConversationInput) {
  const participantIds = uniqueIds([userId, ...input.participantIds]);

  if (participantIds.length < 2) {
    throw new AppError("A conversation needs at least two participants", 400, "INVALID_PARTICIPANTS");
  }

  const existingUsersCount = await UserModel.countDocuments({
    _id: { $in: participantIds }
  });

  if (existingUsersCount !== participantIds.length) {
    throw new AppError("One or more participants were not found", 400, "INVALID_PARTICIPANTS");
  }

  const participantKey = getParticipantKey(input.type, participantIds);

  if (participantKey) {
    const existingConversation = await ConversationModel.findOne({ participantKey });

    if (existingConversation) {
      return existingConversation;
    }
  }

  try {
    return await ConversationModel.create({
      type: input.type,
      participantKey,
      participants: participantIds.map((participantId) => ({
        userId: new Types.ObjectId(participantId),
        readAt: participantId === userId ? new Date() : undefined
      })),
      topic: input.topic,
      productContext: input.productContext
    });
  } catch (error) {
    if (participantKey) {
      const existingConversation = await ConversationModel.findOne({ participantKey });

      if (existingConversation) {
        return existingConversation;
      }
    }

    throw error;
  }
}

export async function markConversationRead(conversation: ConversationDocument, userId: string) {
  const now = new Date();

  await ConversationModel.updateOne(
    {
      _id: conversation._id,
      "participants.userId": userId
    },
    {
      $max: {
        "participants.$.readAt": now
      }
    }
  );

  const updatedConversation = await ConversationModel.findById(conversation._id);

  if (!updatedConversation) {
    throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
  }

  return updatedConversation;
}
