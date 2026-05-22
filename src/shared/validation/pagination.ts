import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function getPagination(query: PaginationQuery) {
  return {
    page: query.page,
    limit: query.limit,
    skip: (query.page - 1) * query.limit
  };
}
