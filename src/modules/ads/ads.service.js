import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listActive(placement) {
  const now = new Date();
  return prisma.ad.findMany({
    where: {
      placement,
      status: "ACTIVE",
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { priority: "desc" },
  });
}

export async function listAll({ status, placement } = {}) {
  return prisma.ad.findMany({
    where: { ...(status ? { status } : {}), ...(placement ? { placement } : {}) },
    include: { campaign: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAd(data) {
  return prisma.ad.create({ data });
}

export async function updateAd(id, data) {
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) throw ApiError.notFound("Ad not found");
  return prisma.ad.update({ where: { id }, data });
}

export async function deleteAd(id) {
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) throw ApiError.notFound("Ad not found");
  await prisma.ad.delete({ where: { id } });
}

export async function trackImpression(adId, userId) {
  await prisma.adImpression.create({ data: { adId, userId } });
}

export async function trackClick(adId, userId) {
  await prisma.adClick.create({ data: { adId, userId } });
}

export async function listCampaigns() {
  return prisma.adCampaign.findMany({ include: { ads: true }, orderBy: { createdAt: "desc" } });
}

export async function createCampaign(data) {
  return prisma.adCampaign.create({ data });
}
