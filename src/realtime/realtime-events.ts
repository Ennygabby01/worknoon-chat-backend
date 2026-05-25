export const realtimeEvents = {
  connectionReady: "connection:ready",
  error: "error",
  conversationJoin: "conversation:join",
  conversationLeave: "conversation:leave",
  conversationJoined: "conversation:joined",
  conversationNew: "conversation:new",
  conversationUpdate: "conversation:update",
  messageSend: "message:send",
  messageNew: "message:new",
  messageSent: "message:sent",
  typingStart: "typing:start",
  typingStop: "typing:stop",
  typingUpdate: "typing:update",
  presenceRequest: "presence:request",
  presenceUpdate: "presence:update"
} as const;

export function getConversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}

export function getAgentQueueRoom() {
  return "agent:queue";
}

export function getUserRoom(userId: string) {
  return `user:${userId}`;
}
