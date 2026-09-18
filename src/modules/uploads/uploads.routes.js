import { Router } from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.js";
import * as controller from "./uploads.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(_req, file, cb) {
    const allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
    cb(null, allowed.test(file.mimetype));
  },
});

export const uploadsRouter = Router();

uploadsRouter.post("/", protect, upload.single("file"), controller.upload);
