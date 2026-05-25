import type { OrderDocument } from "./order.model.js";

export function presentOrder(order: OrderDocument) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    buyerId: order.buyerId.toString(),
    sellerId: order.sellerId.toString(),
    productName: order.productName,
    amount: order.amount,
    status: order.status,
    sellerRole: order.sellerRole,
    conversationId: order.conversationId?.toString() ?? null,
    placedAt: order.placedAt.toISOString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString()
  };
}
