import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listCategories({ includeInactive = false } = {}) {
  return prisma.serviceCategory.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { children: true, _count: { select: { services: true } } },
  });
}

export async function getCategory(id) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { children: true, services: true },
  });
  if (!category) throw ApiError.notFound("Service category not found");
  return category;
}

export async function createCategory(data) {
  return prisma.serviceCategory.create({
    data: { ...data, slug: data.slug || slugify(data.name) },
  });
}

export async function updateCategory(id, data) {
  await getCategory(id);
  return prisma.serviceCategory.update({ where: { id }, data });
}

export async function deleteCategory(id) {
  await getCategory(id);
  const serviceCount = await prisma.service.count({ where: { categoryId: id } });
  if (serviceCount > 0) {
    throw ApiError.conflict("Cannot delete a category that still has services — deactivate it instead");
  }
  await prisma.serviceCategory.delete({ where: { id } });
}
