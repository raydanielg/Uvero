import * as integrationsService from "./integrations.service.js";

export async function list(req, res) {
  const integrations = await integrationsService.list({ category: req.query.category });
  res.json({ success: true, data: integrations });
}

export async function upsert(req, res) {
  const integration = await integrationsService.upsert(req.body, req.user.id, req);
  res.status(201).json({ success: true, data: integration });
}

export async function setEnabled(req, res) {
  const integration = await integrationsService.setEnabled(
    req.params.code,
    req.body.isEnabled,
    req.user.id,
    req,
  );
  res.json({ success: true, data: integration });
}
