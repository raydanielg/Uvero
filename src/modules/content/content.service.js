import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

// -- Pages --------------------------------------------------------------
export async function getPage(slug) {
  const page = await prisma.contentPage.findUnique({ where: { slug } });
  if (!page || !page.isPublished) throw ApiError.notFound("Page not found");
  return page;
}

export async function listPages() {
  return prisma.contentPage.findMany({ orderBy: { title: "asc" } });
}

export async function upsertPage(slug, data, actorId) {
  return prisma.contentPage.upsert({
    where: { slug },
    update: { ...data, updatedBy: actorId },
    create: { ...data, slug, updatedBy: actorId },
  });
}

export async function deletePage(slug) {
  await prisma.contentPage.delete({ where: { slug } });
}

// -- FAQs -----------------------------------------------------------------
export async function listFaqs({ category, includeUnpublished = false } = {}) {
  return prisma.faq.findMany({
    where: { ...(category ? { category } : {}), ...(includeUnpublished ? {} : { isPublished: true }) },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createFaq(data) {
  return prisma.faq.create({ data });
}

export async function updateFaq(id, data) {
  return prisma.faq.update({ where: { id }, data });
}

export async function deleteFaq(id) {
  await prisma.faq.delete({ where: { id } });
}

// -- Banners ----------------------------------------------------------------
export async function listBanners({ placement, activeOnly = true } = {}) {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      ...(placement ? { placement } : {}),
      ...(activeOnly
        ? {
            isActive: true,
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          }
        : {}),
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createBanner(data) {
  return prisma.banner.create({ data });
}

export async function updateBanner(id, data) {
  return prisma.banner.update({ where: { id }, data });
}

export async function deleteBanner(id) {
  await prisma.banner.delete({ where: { id } });
}

// -- Announcements ------------------------------------------------------
export async function listAnnouncements({ audience, activeOnly = true } = {}) {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      ...(audience ? { audience: { in: [audience, "ALL"] } } : {}),
      ...(activeOnly
        ? {
            isActive: true,
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAnnouncement(data) {
  return prisma.announcement.create({ data });
}

// -- Legal documents ------------------------------------------------------
export async function getLegalDocument(type) {
  const doc = await prisma.legalDocument.findFirst({ where: { type }, orderBy: { effectiveAt: "desc" } });
  if (!doc) throw ApiError.notFound("Legal document not found");
  return doc;
}

export async function publishLegalDocument(data) {
  return prisma.legalDocument.create({ data });
}
