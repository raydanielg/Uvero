import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as requestsService from "./requests.service.js";
import * as matchingEngine from "../matching/matching.engine.js";

export async function create(req, res) {
  const request = await requestsService.createRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data: request });
}

export async function get(req, res) {
  const request = await requestsService.getRequest(req.params.id, req.user.id);
  res.json({ success: true, data: request });
}

export async function listMine(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total, summary } = await requestsService.listMine(req.user.id, req.query, { skip, take });
  res.json({ success: true, data: rows, meta: { ...paginationMeta({ page, limit, total }), summary } });
}

export async function tracking(req, res) {
  res.json({ success: true, data: await requestsService.getTracking(req.params.id, req.user.id) });
}

export async function cancel(req, res) {
  const request = await requestsService.cancelRequest(req.params.id, req.user.id, req.body.reason);
  res.json({ success: true, data: request });
}

export async function acceptMatch(req, res) {
  const job = await matchingEngine.acceptMatch(req.params.matchId, req.user.id);
  res.status(201).json({ success: true, data: job });
}

export async function declineMatch(req, res) {
  const nextMatch = await matchingEngine.declineMatch(req.params.matchId, req.user.id);
  res.json({ success: true, data: nextMatch });
}
