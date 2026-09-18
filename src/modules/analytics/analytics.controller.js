import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as analyticsService from "./analytics.service.js";

export async function listEvents(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { name, from, to } = req.query;
  const { rows, total } = await analyticsService.listEvents(
    { name, from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined },
    { skip, take },
  );
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}
