import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateCustomerSchema, UpdateCustomerSchema } from "./customer.validation";

const router = Router();
const controller = new CustomerController();

router.use(authenticate);

router.post("/", validate(CreateCustomerSchema), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validate(UpdateCustomerSchema), controller.update);
router.delete("/:id", controller.delete);

export default router;
