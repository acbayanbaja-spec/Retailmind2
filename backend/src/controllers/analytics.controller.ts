import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics.service";
import { sendSuccess } from "../utils/response";
import {
  listForecastsQuerySchema,
  listRecommendationsQuerySchema,
  recommendationIdParamSchema,
  updateRecommendationSchema,
} from "../validators/analytics.validator";

export const analyticsController = {
  async overview(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getOverview();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async listForecasts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listForecastsQuerySchema.parse(req.query);
      const forecasts = await analyticsService.listForecasts(query);
      sendSuccess(res, forecasts);
    } catch (err) {
      next(err);
    }
  },

  async listRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listRecommendationsQuerySchema.parse(req.query);
      const recommendations = await analyticsService.listRecommendations(query);
      sendSuccess(res, recommendations);
    } catch (err) {
      next(err);
    }
  },

  async generate(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.generateInsights();
      sendSuccess(res, data, "Insights generated");
    } catch (err) {
      next(err);
    }
  },

  async updateRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = recommendationIdParamSchema.parse(req.params);
      const input = updateRecommendationSchema.parse(req.body);
      const recommendation = await analyticsService.updateRecommendation(
        id,
        input
      );
      sendSuccess(res, recommendation, "Recommendation updated");
    } catch (err) {
      next(err);
    }
  },
};
