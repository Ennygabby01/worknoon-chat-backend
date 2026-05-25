import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { presentConversation } from "../conversations/conversation.presenter.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import {
  adminConversationListQuerySchema,
  adminUpdateUserSchema,
  adminUserIdParamsSchema,
  type AdminConversationListQuery,
  type AdminUpdateUserInput,
  type AdminUserIdParams
} from "./admin.schemas.js";
import { adminUpdateUser, listAdminConversations } from "./admin.service.js";
import { presentUser } from "../users/user.presenter.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get(
  "/conversations",
  validateRequest({ query: adminConversationListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listAdminConversations(req.validatedQuery as AdminConversationListQuery);

    res.json({
      conversations: result.conversations.map((conversation) =>
        presentConversation(conversation)
      ),
      pagination: result.pagination
    });
  })
);

adminRouter.patch(
  "/users/:id",
  validateRequest({ params: adminUserIdParamsSchema, body: adminUpdateUserSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams as AdminUserIdParams;
    const user = await adminUpdateUser(id, req.validatedBody as AdminUpdateUserInput);
    res.json({ user: presentUser(user) });
  })
);
