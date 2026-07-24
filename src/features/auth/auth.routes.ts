import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { LoginSchema, SetupPasswordSchema } from "./auth.validation";

const router = Router();
const controller = new AuthController();

router.post("/login", validate(LoginSchema), controller.login);
router.get("/me", authenticate, controller.me);
router.get("/validate-token/:token", controller.validateToken);
router.post("/setup-password", validate(SetupPasswordSchema), controller.setupPassword);

export default router;
