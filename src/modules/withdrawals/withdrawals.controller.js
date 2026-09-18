import { prisma } from "../../config/prisma.js";
import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as withdrawalsService from "./withdrawals.service.js";

async function myProviderId(userId) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId } });
  return provider?.id;
}

export async function listPayoutAccounts(req, res) {
  const providerId = await myProviderId(req.user.id);
  const accounts = await withdrawalsService.listPayoutAccounts(providerId);
  res.json({ success: true, data: accounts });
}

export async function addPayoutAccount(req, res) {
  const providerId = await myProviderId(req.user.id);
  const account = await withdrawalsService.addPayoutAccount(providerId, req.body);
  res.status(201).json({ success: true, data: account });
}

export async function requestWithdrawal(req, res) {
  const withdrawal = await withdrawalsService.requestWithdrawal(req.user.id, req.body);
  res.status(201).json({ success: true, data: withdrawal });
}

export async function listMine(req, res) {
  const providerId = await myProviderId(req.user.id);
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await withdrawalsService.listMine(providerId, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function listAll(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await withdrawalsService.listAll({ status: req.query.status }, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function approve(req, res) {
  const withdrawal = await withdrawalsService.approve(req.params.id, req.user.id, req);
  res.json({ success: true, data: withdrawal });
}

export async function reject(req, res) {
  const withdrawal = await withdrawalsService.reject(req.params.id, req.user.id, req.body.note, req);
  res.json({ success: true, data: withdrawal });
}
