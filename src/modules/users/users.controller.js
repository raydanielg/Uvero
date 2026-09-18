import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as usersService from "./users.service.js";

export async function list(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await usersService.list(req.query, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function get(req, res) {
  const user = await usersService.get(req.params.id);
  res.json({ success: true, data: user });
}

export async function setStatus(req, res) {
  const user = await usersService.setStatus(req.params.id, req.body.status, req.user.id, req);
  res.json({ success: true, data: user });
}
