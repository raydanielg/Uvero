import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as supportService from "./support.service.js";

export async function create(req, res) {
  const ticket = await supportService.createTicket(req.user.id, req.body);
  res.status(201).json({ success: true, data: ticket });
}

export async function addMessage(req, res) {
  const message = await supportService.addMessage(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: message });
}

export async function get(req, res) {
  const ticket = await supportService.getTicket(req.params.id, req.user.id);
  res.json({ success: true, data: ticket });
}

export async function listMine(req, res) {
  const tickets = await supportService.listMine(req.user.id);
  res.json({ success: true, data: tickets });
}

export async function listAll(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await supportService.listAll({ status: req.query.status }, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function assign(req, res) {
  const ticket = await supportService.assign(req.params.id, req.body.assignedTo);
  res.json({ success: true, data: ticket });
}

export async function updateStatus(req, res) {
  const ticket = await supportService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, data: ticket });
}
