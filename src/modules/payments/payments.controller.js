import * as paymentsService from "./payments.service.js";

export async function initiate(req, res) {
  const payment = await paymentsService.initiatePayment(req.body.jobId, req.user.id, req.body.method);
  res.status(201).json({ success: true, data: payment });
}

export async function get(req, res) {
  const payment = await paymentsService.getPayment(req.params.id);
  res.json({ success: true, data: payment });
}

// Webhook signature verification is gateway-specific; the mock/cash
// gateways used in dev have no real signature so we trust the payload.
// A real gateway module should export a `verify(req)` used here instead.
export async function webhook(req, res) {
  await paymentsService.handleWebhook(req.params.code, req.body, true);
  res.json({ success: true });
}
