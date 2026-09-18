import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";

export const auditRouter = Router();

auditRouter.get("/", protect, requirePermission("audit.view"), async (req, res) => {
  const { page, limit, skip, take } = parsePagination(req.query);
  const where = {
    ...(req.query.actorId ? { actorId: req.query.actorId } : {}),
    ...(req.query.entityType ? { entityType: req.query.entityType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
});
