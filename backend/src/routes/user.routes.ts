import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../validators/user.validator";

const router = Router();

router.use(authenticate);
router.use(requirePermission("users.manage"));

router.get("/roles", userController.listRoles);
router.get("/", validateQuery(listUsersQuerySchema), userController.list);
router.get("/:id", userController.getById);
router.post("/", validateBody(createUserSchema), userController.create);
router.patch("/:id", validateBody(updateUserSchema), userController.update);
router.delete("/:id", userController.remove);

export default router;
