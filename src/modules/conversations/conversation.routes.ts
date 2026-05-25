import { Router } from "express";
import type { Server } from "socket.io";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { presentConversation } from "./conversation.presenter.js";
import { ConversationModel } from "./conversation.model.js";
import {
  conversationIdParamsSchema,
  createConversationSchema,
  createSupportConversationSchema,
  type ConversationIdParams,
  type CreateConversationInput,
  type CreateSupportConversationInput
} from "./conversation.schemas.js";
import {
  assertConversationMember,
  claimConversation,
  createConversation,
  createSupportConversation,
  escalateConversation,
  listAgentCases,
  listConversationsForUser,
  listEscalatedQueue,
  markConversationRead,
  resolveConversation
} from "./conversation.service.js";
import { assertMessageBodyAllowed, createConversationMessage, markMessagesRead } from "../messages/message.service.js";
import { MessageModel } from "../messages/message.model.js";
import { presentMessage } from "../messages/message.presenter.js";
import { getAgentQueueRoom, getConversationRoom, getUserRoom, realtimeEvents } from "../../realtime/realtime-events.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await listConversationsForUser(
      req.user!._id.toString(),
      req.user!.role
    );

    const lastMessageIds = conversations
      .map((c) => c.lastMessageId)
      .filter(Boolean);

    const lastMessages = await MessageModel.find(
      { _id: { $in: lastMessageIds } },
      { body: 1 }
    ).lean();

    const bodyMap = new Map(lastMessages.map((m) => [m._id.toString(), m.body]));

    res.json({
      conversations: conversations.map((conv) =>
        presentConversation(
          conv,
          conv.lastMessageId ? (bodyMap.get(conv.lastMessageId.toString()) ?? null) : null
        )
      )
    });
  })
);

conversationRouter.post(
  "/",
  validateRequest({ body: createConversationSchema }),
  asyncHandler(async (req, res) => {
    const conversation = await createConversation(
      req.user!._id.toString(),
      req.validatedBody as CreateConversationInput
    );
    const conversationPayload = presentConversation(conversation);
    const io = req.app.get("io") as Server | undefined;

    if (io) {
      for (const participant of conversation.participants) {
        io.to(getUserRoom(participant.userId.toString())).emit(realtimeEvents.conversationNew, {
          conversation: conversationPayload
        });
      }
    }

    res.status(201).json({
      conversation: conversationPayload
    });
  })
);

conversationRouter.post(
  "/support",
  validateRequest({ body: createSupportConversationSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validatedBody as CreateSupportConversationInput;
    const senderId = req.user!._id.toString();

    const transcript = input.transcript ?? (
      input.openingMessage
        ? [{ role: "user" as const, text: input.openingMessage }]
        : []
    );

    if (transcript.length === 0) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Opening transcript is required" } });
      return;
    }

    for (const item of transcript) {
      assertMessageBodyAllowed(item.text);
    }

    const conversation = await createSupportConversation(senderId, input);
    let lastBody: string | null = null;
    const messages = [];

    for (const [index, item] of transcript.entries()) {
      const message = await createConversationMessage(
        conversation,
        senderId,
        {
          body: item.text,
          clientMessageId: `${input.clientMessageId}-${index}`
        },
        {
          senderKind: item.role === "bot" ? "assistant" : "user",
          senderName: item.role === "bot" ? "Worknoon Assistant" : undefined,
          createdAt: item.timestamp ? new Date(item.timestamp) : undefined
        }
      );
      messages.push(message);
      lastBody = message.body;
    }

    const updatedConversation = await ConversationModel.findById(conversation._id);
    if (!updatedConversation) {
      res.status(201).json({
        conversation: presentConversation(conversation, lastBody)
      });
      return;
    }
    const conversationPayload = presentConversation(updatedConversation, lastBody);

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      for (const message of messages) {
        io.to(getConversationRoom(conversation._id.toString())).emit(realtimeEvents.messageNew, {
          message: presentMessage(message)
        });
      }
      for (const participant of updatedConversation.participants) {
        io.to(getUserRoom(participant.userId.toString())).emit(realtimeEvents.conversationNew, {
          conversation: conversationPayload
        });
      }
      io.to(getAgentQueueRoom()).emit(realtimeEvents.conversationNew, {
        conversation: conversationPayload
      });
    }

    res.status(201).json({
      conversation: conversationPayload
    });
  })
);

conversationRouter.get(
  "/queue",
  requireRole("agent"),
  asyncHandler(async (_req, res) => {
    const conversations = await listEscalatedQueue();
    res.json({ conversations: conversations.map((c) => presentConversation(c)) });
  })
);

conversationRouter.get(
  "/my-cases",
  requireRole("agent"),
  asyncHandler(async (req, res) => {
    const conversations = await listAgentCases(req.user!._id.toString());
    res.json({ conversations: conversations.map((c) => presentConversation(c)) });
  })
);

conversationRouter.get(
  "/:id",
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const conversation = await assertConversationMember(params.id, req.user!._id.toString());

    res.json({
      conversation: presentConversation(conversation)
    });
  })
);

conversationRouter.patch(
  "/:id/read",
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const userId = req.user!._id.toString();
    const conversation = await assertConversationMember(params.id, userId);

    await markMessagesRead(params.id, userId);
    const updatedConversation = await markConversationRead(conversation, userId);

    res.json({
      conversation: presentConversation(updatedConversation)
    });
  })
);

conversationRouter.post(
  "/:id/escalate",
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const conversation = await escalateConversation(params.id, req.user!._id.toString());
    res.json({ conversation: presentConversation(conversation) });
  })
);

conversationRouter.post(
  "/:id/claim",
  requireRole("agent"),
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const conversation = await claimConversation(params.id, req.user!._id.toString());
    const conversationPayload = presentConversation(conversation);
    const io = req.app.get("io") as Server | undefined;
    if (io) {
      io.to(getConversationRoom(conversation._id.toString())).emit(realtimeEvents.conversationUpdate, {
        conversation: conversationPayload
      });
      for (const participant of conversation.participants) {
        io.to(getUserRoom(participant.userId.toString())).emit(realtimeEvents.conversationUpdate, {
          conversation: conversationPayload
        });
      }
    }
    res.json({ conversation: conversationPayload });
  })
);

conversationRouter.post(
  "/:id/resolve",
  requireRole("agent"),
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const conversation = await resolveConversation(params.id, req.user!._id.toString());
    res.json({ conversation: presentConversation(conversation) });
  })
);
