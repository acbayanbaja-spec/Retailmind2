import { z } from "zod";

export const updateRecommendationSchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
});

export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>;

export const recommendationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listForecastsQuerySchema = z.object({
  type: z.enum(["SALES", "DEMAND", "REVENUE", "SEASONAL"]).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type ListForecastsQuery = z.infer<typeof listForecastsQuerySchema>;

export const listRecommendationsQuerySchema = z.object({
  includeDismissed: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type ListRecommendationsQuery = z.infer<
  typeof listRecommendationsQuerySchema
>;
