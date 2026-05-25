import type { ExtendedError, Socket } from "socket.io";
import { AppError } from "../shared/errors/app-error.js";
import { UserModel } from "../modules/users/user.model.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";
import type { UserRole } from "../modules/users/user-role.js";

export type AuthenticatedSocket = Socket & {
  userId: string;
  userRole: UserRole;
};

function getSocketToken(socket: Socket) {
  const auth = socket.handshake.auth as { token?: unknown };
  const authToken = auth.token;

  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const authorization = socket.handshake.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token, extra] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || extra) {
    throw new AppError("Authorization header is invalid", 401, "INVALID_AUTH_HEADER");
  }

  return token;
}

export async function authenticateSocket(socket: Socket, next: (error?: ExtendedError) => void) {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      throw new AppError("Authentication is required", 401, "AUTH_REQUIRED");
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).select("_id role");

    if (!user) {
      throw new AppError("Authentication is invalid", 401, "INVALID_AUTH_TOKEN");
    }

    (socket as AuthenticatedSocket).userId = user._id.toString();
    (socket as AuthenticatedSocket).userRole = user.role;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
}
