import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { conversationRouter } from "./modules/conversations/conversation.routes.js";
import { messageRouter } from "./modules/messages/message.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { errorHandler } from "./shared/http/error-handler.js";
import { notFoundHandler } from "./shared/http/not-found.js";
import { requireJsonContent } from "./shared/http/require-json.js";
import { securityHeaders } from "./shared/http/security-headers.js";

const apiV1Prefix = "/api/v1";

export function createApp() {
  const app = express();

  app.use(securityHeaders);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(requireJsonContent);
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(`${apiV1Prefix}/auth`, authRouter);
  app.use(`${apiV1Prefix}/users`, userRouter);
  app.use(`${apiV1Prefix}/conversations`, conversationRouter);
  app.use(`${apiV1Prefix}/messages`, messageRouter);
  app.use(`${apiV1Prefix}/admin`, adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
