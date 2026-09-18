import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getStorageProvider } from "../../providers/storage/index.js";
import { listBanners, listAnnouncements } from "../content/content.service.js";
import { listActive as listActiveAds } from "../ads/ads.service.js";

export const ACTIVE_REQUEST_STATUSES = ["PENDING", "MATCHING", "MATCHED", "ACCEPTED", "IN_PROGRESS"];

const userSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  avatarUrl: true,
  language: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  createdAt: true,
};

export async function getOrCreateProfile(userId) {
  const existing = await prisma.customerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.customerProfile.create({ data: { userId } });
}

async function getStats(userId) {
  const [total, active, completed, cancelled, spent] = await Promise.all([
    prisma.serviceRequest.count({ where: { customerId: userId } }),
    prisma.serviceRequest.count({ where: { customerId: userId, status: { in: ACTIVE_REQUEST_STATUSES } } }),
    prisma.serviceRequest.count({ where: { customerId: userId, status: "COMPLETED" } }),
    prisma.serviceRequest.count({ where: { customerId: userId, status: "CANCELLED" } }),
    prisma.payment.aggregate({ where: { customerId: userId, status: "COMPLETED" }, _sum: { amount: true } }),
  ]);
  return { totalRequests: total, activeRequests: active, completedRequests: completed, cancelledRequests: cancelled, totalSpent: Number(spent._sum.amount ?? 0) };
}

export async function getMe(userId) {
  const [user, profile, stats, addressCount, unread] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: userSelect }),
    getOrCreateProfile(userId),
    getStats(userId),
    prisma.address.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { ...user, profile: { maxActiveRequests: profile.maxActiveRequests, averageRating: profile.averageRating }, stats, addressCount, unreadNotifications: unread };
}

export async function updateMe(userId, data) {
  try {
    const before = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    return await prisma.user.update({
      where: { id: userId },
      data: { ...data, ...(data.email && data.email !== before.email ? { isEmailVerified: false } : {}) },
      select: userSelect,
    });
  } catch (err) {
    if (err.code === "P2002") throw ApiError.conflict("That email is already in use");
    throw err;
  }
}

function relativePath(url) {
  return url?.startsWith("/uploads/") ? url.slice("/uploads/".length) : null;
}

export async function setAvatar(userId, file) {
  const storage = getStorageProvider();
  const { url } = await storage.upload(file.buffer, { originalName: file.originalname, folder: "avatars" });
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url }, select: userSelect });
  const old = relativePath(before.avatarUrl);
  if (old) storage.delete(old).catch(() => {});
  return user;
}

export async function removeAvatar(userId) {
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null }, select: userSelect });
  const old = relativePath(before.avatarUrl);
  if (old) getStorageProvider().delete(old).catch(() => {});
  return user;
}

export async function deleteAccount(userId) {
  const active = await prisma.serviceRequest.count({ where: { customerId: userId, status: { in: ACTIVE_REQUEST_STATUSES } } });
  if (active > 0) throw ApiError.conflict("Cancel or finish your active requests before deleting your account");
  await prisma.$transaction([
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { status: "INACTIVE", deletedAt: new Date() } }),
  ]);
}

// -- Home dashboard ---------------------------------------------------------
export async function getHome(userId) {
  const [me, activeRequests, categories, popular, banners, announcements, ads] = await Promise.all([
    getMe(userId),
    prisma.serviceRequest.findMany({
      where: { customerId: userId, status: { in: ACTIVE_REQUEST_STATUSES } },
      include: { service: { select: { id: true, name: true, iconUrl: true } }, job: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.serviceCategory.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, iconUrl: true, _count: { select: { services: true } } },
    }),
    popularServices(6),
    listBanners({ placement: "CUSTOMER_HOME" }),
    listAnnouncements({ audience: "CUSTOMERS" }),
    listActiveAds("CUSTOMER_HOME"),
  ]);

  const hour = new Date().getHours();
  return {
    greeting: { name: me.name, period: hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening" },
    stats: me.stats,
    unreadNotifications: me.unreadNotifications,
    activeRequests,
    categories,
    popularServices: popular,
    banners,
    announcements,
    ads,
  };
}

export async function popularServices(limit = 6) {
  const grouped = await prisma.serviceRequest.groupBy({
    by: ["serviceId"],
    _count: { serviceId: true },
    orderBy: { _count: { serviceId: "desc" } },
    take: limit,
  });
  let services = await prisma.service.findMany({
    where: { isActive: true, id: { in: grouped.map((g) => g.serviceId) } },
    include: { category: { select: { name: true, slug: true } } },
  });
  services.sort((a, b) => grouped.findIndex((g) => g.serviceId === a.id) - grouped.findIndex((g) => g.serviceId === b.id));
  if (services.length < limit) {
    const more = await prisma.service.findMany({
      where: { isActive: true, id: { notIn: services.map((s) => s.id) } },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { sortOrder: "asc" },
      take: limit - services.length,
    });
    services = [...services, ...more];
  }
  return services;
}

// -- Activity feed ------------------------------------------------------------
const EVENT_LABELS = {
  REQUEST_CREATED: "You created a request",
  PROVIDER_ACCEPTED: "A provider accepted your request",
  NO_PROVIDER_AVAILABLE: "No provider was available",
  REQUEST_CANCELLED: "You cancelled a request",
  JOB_COMPLETED: "Your job was completed",
};

export async function getActivity(userId, { limit = 30 } = {}) {
  const [events, payments, ratings] = await Promise.all([
    prisma.requestEvent.findMany({
      where: { request: { customerId: userId } },
      include: { request: { select: { id: true, service: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.payment.findMany({ where: { customerId: userId }, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.rating.findMany({ where: { fromUserId: userId }, orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  const items = [
    ...events.map((e) => ({
      type: "REQUEST",
      title: EVENT_LABELS[e.eventType] ?? e.eventType,
      subtitle: e.request.service.name,
      refId: e.request.id,
      at: e.createdAt,
    })),
    ...payments.map((p) => ({
      type: "PAYMENT",
      title: p.status === "COMPLETED" ? "Payment completed" : `Payment ${p.status.toLowerCase()}`,
      subtitle: `${p.method} · ${p.currency} ${Number(p.amount).toLocaleString("en-US")}`,
      refId: p.jobId,
      at: p.createdAt,
    })),
    ...ratings.map((r) => ({ type: "RATING", title: `You rated a provider ${r.score}/5`, subtitle: null, refId: r.jobId, at: r.createdAt })),
  ];
  return items.sort((a, b) => b.at - a.at).slice(0, limit);
}

// -- Terms & conditions -------------------------------------------------------
const CUSTOMER_DOCS = ["TERMS", "PRIVACY", "REFUND_POLICY"];

export async function getLegalStatus(userId) {
  const docs = await prisma.legalDocument.findMany({
    where: { type: { in: CUSTOMER_DOCS } },
    orderBy: { effectiveAt: "desc" },
    distinct: ["type"],
  });
  const accepted = await prisma.legalAcceptance.findMany({
    where: { userId, documentId: { in: docs.map((d) => d.id) } },
  });
  const byDoc = new Map(accepted.map((a) => [a.documentId, a.acceptedAt]));
  const documents = docs.map((d) => ({
    id: d.id,
    type: d.type,
    version: d.version,
    effectiveAt: d.effectiveAt,
    bodyHtml: d.bodyHtml,
    accepted: byDoc.has(d.id),
    acceptedAt: byDoc.get(d.id) ?? null,
  }));
  return { allAccepted: documents.filter((d) => d.type !== "REFUND_POLICY").every((d) => d.accepted), documents };
}

export async function acceptLegal(userId, { types }, ip) {
  const docs = await prisma.legalDocument.findMany({
    where: { type: { in: types } },
    orderBy: { effectiveAt: "desc" },
    distinct: ["type"],
  });
  if (docs.length === 0) throw ApiError.notFound("No matching legal document");
  await Promise.all(
    docs.map((d) =>
      prisma.legalAcceptance.upsert({
        where: { userId_documentId: { userId, documentId: d.id } },
        update: {},
        create: { userId, documentId: d.id, ipAddress: ip },
      }),
    ),
  );
  return getLegalStatus(userId);
}

// -- Addresses ------------------------------------------------------------------
export async function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function addAddress(userId, data) {
  const first = (await prisma.address.count({ where: { userId } })) === 0;
  const isDefault = data.isDefault || first;
  if (isDefault) await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.address.create({ data: { ...data, isDefault, userId } });
}

export async function updateAddress(userId, addressId, data) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound("Address not found");
  if (data.isDefault) await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.address.update({ where: { id: addressId }, data });
}

export async function deleteAddress(userId, addressId) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound("Address not found");
  const inUse = await prisma.serviceRequest.count({ where: { addressId } });
  if (inUse > 0) throw ApiError.conflict("This address is used by existing requests and can't be deleted");
  await prisma.address.delete({ where: { id: addressId } });
}
