import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateRequest } from "../../shared/validation/validate-request.js";
import { presentOrder } from "./order.presenter.js";
import { orderListQuerySchema, type OrderListQuery } from "./order.schemas.js";
import { listOrdersForUser } from "./order.service.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.get(
  "/",
  validateRequest({ query: orderListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listOrdersForUser(
      req.user!._id.toString(),
      req.validatedQuery as OrderListQuery
    );

    res.json({
      orders: result.orders.map(presentOrder),
      pagination: result.pagination
    });
  })
);
