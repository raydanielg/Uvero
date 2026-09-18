import * as flagsService from "./feature-flags.service.js";

export async function list(_req, res) {
  const flags = await flagsService.listFlags();
  res.json({ success: true, data: flags });
}

export async function create(req, res) {
  const flag = await flagsService.createFlag(req.body, req.user.id);
  res.status(201).json({ success: true, data: flag });
}

export async function update(req, res) {
  const flag = await flagsService.updateFlag(req.params.key, req.body, req.user.id, req);
  res.json({ success: true, data: flag });
}
