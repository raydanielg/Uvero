import * as contentService from "./content.service.js";

export async function getPage(req, res) {
  const page = await contentService.getPage(req.params.slug);
  res.json({ success: true, data: page });
}

export async function listPages(_req, res) {
  const pages = await contentService.listPages();
  res.json({ success: true, data: pages });
}

export async function upsertPage(req, res) {
  const page = await contentService.upsertPage(req.params.slug, req.body, req.user.id);
  res.json({ success: true, data: page });
}

export async function deletePage(req, res) {
  await contentService.deletePage(req.params.slug);
  res.json({ success: true, message: "Page deleted" });
}

export async function listFaqs(req, res) {
  const faqs = await contentService.listFaqs({ category: req.query.category });
  res.json({ success: true, data: faqs });
}

export async function createFaq(req, res) {
  const faq = await contentService.createFaq(req.body);
  res.status(201).json({ success: true, data: faq });
}

export async function updateFaq(req, res) {
  const faq = await contentService.updateFaq(req.params.id, req.body);
  res.json({ success: true, data: faq });
}

export async function deleteFaq(req, res) {
  await contentService.deleteFaq(req.params.id);
  res.json({ success: true, message: "FAQ deleted" });
}

export async function listBanners(req, res) {
  const banners = await contentService.listBanners({ placement: req.query.placement });
  res.json({ success: true, data: banners });
}

export async function createBanner(req, res) {
  const banner = await contentService.createBanner(req.body);
  res.status(201).json({ success: true, data: banner });
}

export async function updateBanner(req, res) {
  const banner = await contentService.updateBanner(req.params.id, req.body);
  res.json({ success: true, data: banner });
}

export async function deleteBanner(req, res) {
  await contentService.deleteBanner(req.params.id);
  res.json({ success: true, message: "Banner deleted" });
}

export async function listAnnouncements(req, res) {
  const announcements = await contentService.listAnnouncements({ audience: req.query.audience });
  res.json({ success: true, data: announcements });
}

export async function createAnnouncement(req, res) {
  const announcement = await contentService.createAnnouncement(req.body);
  res.status(201).json({ success: true, data: announcement });
}

export async function getLegalDocument(req, res) {
  const doc = await contentService.getLegalDocument(req.params.type);
  res.json({ success: true, data: doc });
}

export async function publishLegalDocument(req, res) {
  const doc = await contentService.publishLegalDocument(req.body);
  res.status(201).json({ success: true, data: doc });
}
