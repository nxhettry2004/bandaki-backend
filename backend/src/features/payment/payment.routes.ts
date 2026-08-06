import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreatePaymentSchema } from "./payment.validation";

const router = Router();
const controller = new PaymentController();

router.use(authenticate);

router.post("/", validate(CreatePaymentSchema), controller.create);
// Incremental pull-sync — registered before the bandhaki route for clarity.
router.get("/sync", controller.getUpdatesSince);
router.get("/bandhaki/:bandhakiId", controller.getByBandhaki);

export default router;
