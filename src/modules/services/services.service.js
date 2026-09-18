import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listServices({ categoryId, includeInactive = false } = {}) {
  return prisma.service.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { sortOrder: "asc" },
    include: { pricingRules: true },
  });
}

export async function getService(id) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { pricingRules: true, category: true },
  });
  if (!service) throw ApiError.notFound("Service not found");
  return service;
}

export async function createService(data) {
  return prisma.service.create({
    data: { ...data, slug: data.slug || slugify(data.name) },
  });
}

export async function updateService(id, data) {
  await getService(id);
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id) {
  await getService(id);
  await prisma.service.delete({ where: { id } });
}
