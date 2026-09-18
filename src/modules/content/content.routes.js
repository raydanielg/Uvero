import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  announcementSchema,
  bannerSchema,
  faqSchema,
  legalDocumentSchema,
  upsertPageSchema,
} from "./content.schema.js";
import * as controller from "./content.controller.js";

export const contentRouter = Router();
const manage = [protect, requirePermission("content.manage")];

// Public.
contentRouter.get("/pages/:slug", controller.getPage);
contentRouter.get("/faqs", controller.listFaqs);
contentRouter.get("/banners", controller.listBanners);
contentRouter.get("/announcements", controller.listAnnouncements);
contentRouter.get("/legal/:type", controller.getLegalDocument);

// Admin.
contentRouter.get("/pages", manage, controller.listPages);
contentRouter.put("/pages/:slug", manage, validate(upsertPageSchema), controller.upsertPage);
contentRouter.delete("/pages/:slug", manage, controller.deletePage);

contentRouter.post("/faqs", manage, validate(faqSchema), controller.createFaq);
contentRouter.patch("/faqs/:id", manage, validate(faqSchema.partial()), controller.updateFaq);
contentRouter.delete("/faqs/:id", manage, controller.deleteFaq);

contentRouter.post("/banners", manage, validate(bannerSchema), controller.createBanner);
contentRouter.patch("/banners/:id", manage, validate(bannerSchema.partial()), controller.updateBanner);
contentRouter.delete("/banners/:id", manage, controller.deleteBanner);

contentRouter.post(
  "/announcements",
  manage,
  validate(announcementSchema),
  controller.createAnnouncement,
);

contentRouter.post(
  "/legal",
  manage,
  validate(legalDocumentSchema),
  controller.publishLegalDocument,
);
