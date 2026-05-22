import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { assertConversationMember } from "../conversations/conversation.service.js";
import { presentMessage } from "./message.presenter.js";
import {
  conversationMessageParamsSchema,
  createMessageSchema,
  messageListQuerySchema,
  type ConversationMessageParams,
  type CreateMessageInput,
  type MessageListQuery
} from "./message.schemas.js";
import {
  assertMessageBodyAllowed,
  createConversationMessage,
  listConversationMessages
} from "./message.service.js";

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get(
  "/:conversationId",
  validateRequest({ params: conversationMessageParamsSchema, query: messageListQuerySchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationMessageParams;
    const query = req.validatedQuery as MessageListQuery;
    const messages = await listConversationMessages(
      params.conversationId,
      req.user!._id.toString(),
      query
    );

    res.json({
      messages: messages.reverse().map(presentMessage)
    });
  })
);

messageRouter.post(
  "/:conversationId",
  validateRequest({ params: conversationMessageParamsSchema, body: createMessageSchema }),
  asyncHandler(async (req, res) => {
    const params = req.validatedParams as ConversationMessageParams;
    const input = req.validatedBody as CreateMessageInput;
    const senderId = req.user!._id.toString();
    const conversation = await assertConversationMember(params.conversationId, senderId);

    assertMessageBodyAllowed(input.body);

    const message = await createConversationMessage(conversation, senderId, input);

    res.status(201).json({
      message: presentMessage(message)
    });
  })
);
