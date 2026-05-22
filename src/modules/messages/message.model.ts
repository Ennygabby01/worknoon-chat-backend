import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export type Message = {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  clientMessageId: string;
  readBy: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type MessageDocument = HydratedDocument<Message>;

const messageSchema = new Schema<Message>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000
    },
    clientMessageId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true }
);

export const MessageModel: Model<Message> = model<Message>("Message", messageSchema);
