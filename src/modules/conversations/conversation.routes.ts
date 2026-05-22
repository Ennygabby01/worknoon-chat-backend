import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
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
  createConversation,
  listConversationsForUser,
  markConversationRead
} from "./conversation.service.js";
import { markMessagesRead } from "../messages/message.service.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await listConversationsForUser(req.user!._id.toString());

    res.json({
      conversations: conversations.map(presentConversation)
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
