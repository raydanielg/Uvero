import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { addressSchema, updateAddressSchema, updateProfileSchema } from "./customers.schema.js";
import * as controller from "./customers.controller.js";

export const customersRouter = Router();

customersRouter.use(protect, restrictTo("CUSTOMER"));

customersRouter.get("/me", controller.getMyProfile);
customersRouter.patch("/me", validate(updateProfileSchema), controller.updateMyProfile);

customersRouter.get("/me/addresses", controller.listAddresses);
customersRouter.post("/me/addresses", validate(addressSchema), controller.addAddress);
customersRouter.patch(
  "/me/addresses/:id",
  validate(updateAddressSchema),
  controller.updateAddress,
);
customersRouter.delete("/me/addresses/:id", controller.deleteAddress);
