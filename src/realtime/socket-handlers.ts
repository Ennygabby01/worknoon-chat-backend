import type { Server } from "socket.io";
import { ZodError } from "zod";
import { assertConversationMember } from "../modules/conversations/conversation.service.js";
import { presentMessage } from "../modules/messages/message.presenter.js";
import { assertMessageBodyAllowed, createConversationMessage } from "../modules/messages/message.service.js";
import { AppError } from "../shared/errors/app-error.js";
import { getConversationRoom, realtimeEvents } from "./realtime-events.js";
import {
  joinConversationPayloadSchema,
  sendMessagePayloadSchema,
  typingPayloadSchema
} from "./realtime.schemas.js";
import type { AuthenticatedSocket } from "./socket-auth.js";

function emitSocketError(socket: AuthenticatedSocket, error: unknown) {
  if (error instanceof ZodError) {
    socket.emit(realtimeEvents.error, {
      code: "VALIDATION_ERROR",
      message: "Invalid event data"
    });
    return;
  }

  if (error instanceof AppError) {
    socket.emit(realtimeEvents.error, {
      code: error.code,
      message: error.message
    });
    return;
  }

  socket.emit(realtimeEvents.error, {
    code: "REALTIME_ERROR",
    message: "Realtime action failed"
  });
}

export function registerSocketHandlers(io: Server, socket: AuthenticatedSocket) {
  socket.emit(realtimeEvents.connectionReady, {
    socketId: socket.id,
    userId: socket.userId
  });

  socket.on(realtimeEvents.conversationJoin, (payload: unknown) => {
    void (async () => {
      try {
        const data = joinConversationPayloadSchema.parse(payload);
        await assertConversationMember(data.conversationId, socket.userId);
        await socket.join(getConversationRoom(data.conversationId));

        socket.emit(realtimeEvents.conversationJoined, {
          conversationId: data.conversationId
        });
      } catch (error) {
        emitSocketError(socket, error);
      }
    })();
  });

  socket.on(realtimeEvents.conversationLeave, (payload: unknown) => {
    const data = joinConversationPayloadSchema.safeParse(payload);

    if (!data.success) {
      emitSocketError(socket, data.error);
      return;
    }

    void socket.leave(getConversationRoom(data.data.conversationId));
  });

  socket.on(realtimeEvents.messageSend, (payload: unknown) => {
    void (async () => {
      try {
        const data = sendMessagePayloadSchema.parse(payload);
        const conversation = await assertConversationMember(data.conversationId, socket.userId);

        assertMessageBodyAllowed(data.body);

        const message = await createConversationMessage(conversation, socket.userId, {
          body: data.body,
          clientMessageId: data.clientMessageId
        });
        const messagePayload = presentMessage(message);
        const room = getConversationRoom(data.conversationId);

        io.to(room).emit(realtimeEvents.messageNew, {
          message: messagePayload
        });

        socket.emit(realtimeEvents.messageSent, {
          message: messagePayload
        });
      } catch (error) {
        emitSocketError(socket, error);
      }
    })();
  });

  socket.on(realtimeEvents.typingStart, (payload: unknown) => {
    const data = typingPayloadSchema.safeParse(payload);

    if (!data.success) {
      emitSocketError(socket, data.error);
      return;
    }

    socket.to(getConversationRoom(data.data.conversationId)).emit(realtimeEvents.typingUpdate, {
      conversationId: data.data.conversationId,
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on(realtimeEvents.typingStop, (payload: unknown) => {
    const data = typingPayloadSchema.safeParse(payload);

    if (!data.success) {
      emitSocketError(socket, data.error);
      return;
    }

    socket.to(getConversationRoom(data.data.conversationId)).emit(realtimeEvents.typingUpdate, {
      conversationId: data.data.conversationId,
      userId: socket.userId,
      isTyping: false
    });
  });
}
