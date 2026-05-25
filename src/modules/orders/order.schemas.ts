import { z } from "zod";
import { paginationQuerySchema } from "../../shared/validation/pagination.js";
import { orderStatuses } from "./order.model.js";

export const orderListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(orderStatuses).optional()
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
