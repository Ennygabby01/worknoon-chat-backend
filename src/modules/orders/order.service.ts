import { getPagination } from "../../shared/validation/pagination.js";
import { OrderModel } from "./order.model.js";
import type { OrderListQuery } from "./order.schemas.js";

export async function listOrdersForUser(userId: string, query: OrderListQuery) {
  const pagination = getPagination(query);
  const filters: Record<string, unknown> = {
    buyerId: userId
  };

  if (query.status) {
    filters.status = query.status;
  }

  const [orders, total] = await Promise.all([
    OrderModel.find(filters)
      .sort({ placedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    OrderModel.countDocuments(filters)
  ]);

  return {
    orders,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total
    }
  };
}
