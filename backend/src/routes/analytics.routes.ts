import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  listForecastsQuerySchema,
  listRecommendationsQuerySchema,
  updateRecommendationSchema,
} from "../validators/analytics.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("analytics.view"));

router.get("/overview", analyticsController.overview);
router.get(
  "/forecasts",
  validateQuery(listForecastsQuerySchema),
  analyticsController.listForecasts
);
router.get(
  "/recommendations",
  validateQuery(listRecommendationsQuerySchema),
  analyticsController.listRecommendations
);
router.post("/generate", analyticsController.generate);
router.patch(
  "/recommendations/:id",
  validateBody(updateRecommendationSchema),
  analyticsController.updateRecommendation
);

export default router;
