import * as adsService from "./ads.service.js";

export async function listActive(req, res) {
  const ads = await adsService.listActive(req.params.placement);
  res.json({ success: true, data: ads });
}

export async function listAll(req, res) {
  const ads = await adsService.listAll(req.query);
  res.json({ success: true, data: ads });
}

export async function create(req, res) {
  const ad = await adsService.createAd(req.body);
  res.status(201).json({ success: true, data: ad });
}

export async function update(req, res) {
  const ad = await adsService.updateAd(req.params.id, req.body);
  res.json({ success: true, data: ad });
}

export async function remove(req, res) {
  await adsService.deleteAd(req.params.id);
  res.json({ success: true, message: "Ad deleted" });
}

export async function impression(req, res) {
  await adsService.trackImpression(req.params.id, req.user?.id);
  res.status(204).end();
}

export async function click(req, res) {
  await adsService.trackClick(req.params.id, req.user?.id);
  res.status(204).end();
}

export async function listCampaigns(_req, res) {
  const campaigns = await adsService.listCampaigns();
  res.json({ success: true, data: campaigns });
}

export async function createCampaign(req, res) {
  const campaign = await adsService.createCampaign(req.body);
  res.status(201).json({ success: true, data: campaign });
}
