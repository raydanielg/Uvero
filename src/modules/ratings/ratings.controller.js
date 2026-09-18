import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as ratingsService from "./ratings.service.js";

export async function rateJob(req, res) {
  const rating = await ratingsService.rateJob(req.params.jobId, req.user.id, req.body);
  res.status(201).json({ success: true, data: rating });
}

export async function listForUser(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await ratingsService.listForUser(req.params.userId, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}
