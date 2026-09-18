import * as settingsService from "./settings.service.js";

export async function list(req, res) {
  const settings = await settingsService.listSettings(req.query);
  res.json({ success: true, data: settings });
}

export async function update(req, res) {
  const updated = await settingsService.updateSetting(
    req.params.key,
    req.body.value,
    req.user.id,
    req,
  );
  res.json({ success: true, data: updated });
}
