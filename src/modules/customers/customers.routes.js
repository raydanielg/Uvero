import { Router } from "express";
import multer from "multer";
import { protect, restrictTo } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  acceptLegalSchema,
  activityQuerySchema,
  addressSchema,
  updateAddressSchema,
  updateProfileSchema,
} from "./customers.schema.js";
import * as controller from "./customers.controller.js";

export const customersRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)),
});

customersRouter.use(protect, restrictTo("CUSTOMER"));

// Profile
customersRouter.get("/me", controller.getMe);
customersRouter.patch("/me", validate(updateProfileSchema), controller.updateMe);
customersRouter.delete("/me", controller.deleteAccount);
customersRouter.put("/me/avatar", avatarUpload.single("file"), controller.setAvatar);
customersRouter.delete("/me/avatar", controller.removeAvatar);

// Dashboard & activity
customersRouter.get("/me/home", controller.home);
customersRouter.get("/me/activity", validate(activityQuerySchema, "query"), controller.activity);

// Terms & conditions
customersRouter.get("/me/legal", controller.legalStatus);
customersRouter.post("/me/legal/accept", validate(acceptLegalSchema), controller.acceptLegal);

// Addresses
customersRouter.get("/me/addresses", controller.listAddresses);
customersRouter.post("/me/addresses", validate(addressSchema), controller.addAddress);
customersRouter.patch("/me/addresses/:id", validate(updateAddressSchema), controller.updateAddress);
customersRouter.delete("/me/addresses/:id", controller.deleteAddress);
