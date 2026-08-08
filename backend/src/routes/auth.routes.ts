import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authRateLimiter } from "../config/security";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.use(authRateLimiter);

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", validateBody(refreshTokenSchema), authController.refresh);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
