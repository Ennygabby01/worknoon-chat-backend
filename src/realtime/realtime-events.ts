export const realtimeEvents = {
  connectionReady: "connection:ready",
  error: "error",
  conversationJoin: "conversation:join",
  conversationLeave: "conversation:leave",
  conversationJoined: "conversation:joined",
  messageSend: "message:send",
  messageNew: "message:new",
  messageSent: "message:sent",
  typingStart: "typing:start",
  typingStop: "typing:stop",
  typingUpdate: "typing:update"
} as const;

export function getConversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}
