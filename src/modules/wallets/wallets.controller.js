import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as walletsService from "./wallets.service.js";

export async function getMyWallet(req, res) {
  const wallet = await walletsService.getOrCreateWallet(req.user.id);
  res.json({ success: true, data: wallet });
}

export async function listMyTransactions(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await walletsService.listTransactions(req.user.id, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}
