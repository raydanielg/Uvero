import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as jobsService from "./jobs.service.js";

export async function listMine(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await jobsService.listMine(req.user.id, req.user.userType, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function get(req, res) {
  const job = await jobsService.getJob(req.params.id, req.user.id);
  res.json({ success: true, data: job });
}

export async function updateStatus(req, res) {
  const job = await jobsService.updateStatus(req.params.id, req.user.id, req.body.status, req.body.note);
  res.json({ success: true, data: job });
}

export async function cancel(req, res) {
  const job = await jobsService.cancelJob(req.params.id, req.user.id, req.body.reason);
  res.json({ success: true, data: job });
}

export async function history(req, res) {
  const history = await jobsService.getHistory(req.params.id);
  res.json({ success: true, data: history });
}
