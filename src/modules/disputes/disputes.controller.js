import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as disputesService from "./disputes.service.js";

export async function raise(req, res) {
  const dispute = await disputesService.raiseDispute(req.body.jobId, req.user.id, req.body);
  res.status(201).json({ success: true, data: dispute });
}

export async function addMessage(req, res) {
  const message = await disputesService.addMessage(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: message });
}

export async function get(req, res) {
  const dispute = await disputesService.getDispute(req.params.id, req.user.id);
  res.json({ success: true, data: dispute });
}

export async function listMine(req, res) {
  const disputes = await disputesService.listMine(req.user.id);
  res.json({ success: true, data: disputes });
}

export async function listAll(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await disputesService.listAll({ status: req.query.status }, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function resolve(req, res) {
  const dispute = await disputesService.resolve(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data: dispute });
}
