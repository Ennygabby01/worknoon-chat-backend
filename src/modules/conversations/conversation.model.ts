import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export const conversationTypes = ["direct", "support"] as const;

export type ConversationType = (typeof conversationTypes)[number];

export type ConversationParticipant = {
  userId: Types.ObjectId;
  readAt?: Date;
};

export type Conversation = {
  type: ConversationType;
  participantKey?: string;
  participants: ConversationParticipant[];
  topic?: string;
  productContext?: {
    productId?: string;
    productName?: string;
  };
  lastMessageId?: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ConversationDocument = HydratedDocument<Conversation>;

const participantSchema = new Schema<ConversationParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    readAt: {
      type: Date
    }
  },
  { _id: false }
);

const conversationSchema = new Schema<Conversation>(
  {
    type: {
      type: String,
      enum: conversationTypes,
      required: true
    },
    participantKey: {
      type: String,
      trim: true
    },
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator(participants: ConversationParticipant[]) {
          return participants.length >= 2;
        },
        message: "A conversation needs at least two participants"
      }
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 120
    },
    productContext: {
      productId: {
        type: String,
        trim: true,
        maxlength: 120
      },
      productName: {
        type: String,
        trim: true,
        maxlength: 160
      }
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message"
    },
    lastMessageAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ "participants.userId": 1, updatedAt: -1 });
conversationSchema.index({ participantKey: 1 }, { unique: true, sparse: true });

export const ConversationModel: Model<Conversation> = model<Conversation>(
  "Conversation",
  conversationSchema
);
