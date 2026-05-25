import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type Order = {
  orderNumber: string;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  productName: string;
  amount: number;
  status: OrderStatus;
  sellerRole: "designer" | "merchant";
  conversationId?: Types.ObjectId;
  placedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type OrderDocument = HydratedDocument<Order>;

const orderSchema = new Schema<Order>(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: orderStatuses,
      required: true
    },
    sellerRole: {
      type: String,
      enum: ["designer", "merchant"],
      required: true
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation"
    },
    placedAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ buyerId: 1, placedAt: -1 });

export const OrderModel: Model<Order> = model<Order>("Order", orderSchema);
