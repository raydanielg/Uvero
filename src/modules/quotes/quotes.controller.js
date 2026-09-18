import * as quotesService from "./quotes.service.js";

export async function create(req, res) {
  const quote = await quotesService.createQuote(req.params.requestId, req.user.id, req.body);
  res.status(201).json({ success: true, data: quote });
}

export async function listForRequest(req, res) {
  const quotes = await quotesService.listForRequest(req.params.requestId);
  res.json({ success: true, data: quotes });
}

export async function respond(req, res) {
  const quote = await quotesService.respondToQuote(req.params.id, req.user.id, req.body.accept);
  res.json({ success: true, data: quote });
}
