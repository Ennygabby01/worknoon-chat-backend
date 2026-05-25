import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { presentConversation } from "./conversation.presenter.js";
import {
  conversationIdParamsSchema,
  createConversationSchema,
  type ConversationIdParams,
  type CreateConversationInput
} from "./conversation.schemas.js";
import {
  assertConversationMember,
  claimConversation,
  createConversation,
  escalateConversation,
  listAgentCases,
  listConversationsForUser,
  listEscalatedQueue,
  markConversationRead,
  resolveConversation
} from "./conversation.service.js";
import { markMessagesRead } from "../messages/message.service.js";
import { MessageModel } from "../messages/message.model.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await listConversationsForUser(req.user!._id.toString());

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

    res.status(201).json({
      conversation: presentConversation(conversation)
    });
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

conversationRouter.post(
  "/:id/claim",
  requireRole("agent"),
  validateRequest({ params: conversationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationIdParams;
    const conversation = await claimConversation(params.id, req.user!._id.toString());
    res.json({ conversation: presentConversation(conversation) });
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
