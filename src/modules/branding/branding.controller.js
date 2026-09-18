import * as brandingService from "./branding.service.js";

export async function get(_req, res) {
  const branding = await brandingService.getBranding();
  res.json({ success: true, data: branding });
}

export async function update(req, res) {
  const branding = await brandingService.updateBranding(req.body, req.user.id, req);
  res.json({ success: true, data: branding });
}
