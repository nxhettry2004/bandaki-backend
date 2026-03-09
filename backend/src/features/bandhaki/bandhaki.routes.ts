import { Router } from "express";
import { BandhakiController } from "./bandhaki.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateBandhakiSchema, UpdateBandhakiSchema, AddImageSchema } from "./bandhaki.validation";

const router = Router();
const controller = new BandhakiController();

router.use(authenticate);

router.post("/", validate(CreateBandhakiSchema), controller.create);
router.get("/active", controller.getActive);
router.get("/", controller.getAll);
router.get("/customer/:customerId", controller.getByCustomer);
router.get("/:id", controller.getById);
router.put("/:id", validate(UpdateBandhakiSchema), controller.update);
router.post("/:id/images", validate(AddImageSchema), controller.addImage);
router.delete("/:id", controller.delete);

export default router;
