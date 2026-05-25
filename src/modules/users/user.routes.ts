import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { presentUser } from "./user.presenter.js";
import {
  changePasswordSchema,
  contactListQuerySchema,
  updateProfileSchema,
  userListQuerySchema,
  type ChangePasswordInput,
  type ContactListQuery,
  type UpdateProfileInput,
  type UserListQuery
} from "./user.schemas.js";
import {
  assertUserLoaded,
  changeUserPassword,
  listChatContacts,
  listUsers,
  updateUserProfile
} from "./user.service.js";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get("/me", (req, res) => {
  res.json({
    user: presentUser(assertUserLoaded(req.user))
  });
});

userRouter.get(
  "/contacts",
  validateRequest({ query: contactListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listChatContacts(
      assertUserLoaded(req.user)._id.toString(),
      req.validatedQuery as ContactListQuery
    );

    res.json({
      users: result.users.map(presentUser),
      pagination: result.pagination
    });
  })
);

userRouter.patch(
  "/me",
  validateRequest({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const user = await updateUserProfile(
      assertUserLoaded(req.user),
      req.validatedBody as UpdateProfileInput
    );

    res.json({
      user: presentUser(user)
    });
  })
);

userRouter.post(
  "/me/password",
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const user = assertUserLoaded(req.user);
    await changeUserPassword(user._id.toString(), req.validatedBody as ChangePasswordInput);
    res.json({ ok: true });
  })
);

userRouter.get(
  "/",
  requireRole("admin"),
  validateRequest({ query: userListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listUsers(req.validatedQuery as UserListQuery);

    res.json({
      users: result.users.map(presentUser),
      pagination: result.pagination
    });
  })
);
