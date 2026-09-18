import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as kycService from "./kyc.service.js";

export async function listRequirements(req, res) {
  const requirements = await kycService.listRequirements(req.query.serviceId);
  res.json({ success: true, data: requirements });
}

export async function createRequirement(req, res) {
  const requirement = await kycService.createRequirement(req.body);
  res.status(201).json({ success: true, data: requirement });
}

export async function submitDocument(req, res) {
  const document = await kycService.submitDocument(req.user.id, req.body);
  res.status(201).json({ success: true, data: document });
}

export async function listSubmissions(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await kycService.listSubmissions({ status: req.query.status }, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function reviewSubmission(req, res) {
  const submission = await kycService.reviewSubmission(req.params.id, req.body, req.user.id, req);
  res.json({ success: true, data: submission });
}
