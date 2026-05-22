import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { presentConversation } from "../conversations/conversation.presenter.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import {
  adminConversationListQuerySchema,
  type AdminConversationListQuery
} from "./admin.schemas.js";
import { listAdminConversations } from "./admin.service.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get(
  "/conversations",
  validateRequest({ query: adminConversationListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listAdminConversations(req.validatedQuery as AdminConversationListQuery);

    res.json({
      conversations: result.conversations.map(presentConversation),
      pagination: result.pagination
    });
  })
);
