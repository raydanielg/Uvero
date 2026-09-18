import { prisma } from "../../config/prisma.js";
import { popularServices } from "../customers/customers.service.js";

const serviceSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconUrl: true,
  category: { select: { id: true, name: true, slug: true } },
  pricingRules: { where: { isActive: true, region: null }, select: { pricingType: true, basePrice: true, minimumPrice: true }, take: 1 },
};

function shape(service) {
  const { pricingRules, ...rest } = service;
  const rule = pricingRules[0];
  return {
    ...rest,
    pricing: rule
      ? { type: rule.pricingType, from: rule.basePrice ?? rule.minimumPrice ?? null }
      : null,
  };
}

// Words in the query must each match the name, description or category — so
// "emergency tow" finds "Emergency Towing" and "cleaning home" finds home cleaning.
export async function search({ q, categoryId, limit }) {
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      AND: words.map((w) => ({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { description: { contains: w, mode: "insensitive" } },
          { category: { name: { contains: w, mode: "insensitive" } } },
        ],
      })),
    },
    select: serviceSelect,
    take: limit,
  });

  const lower = q.toLowerCase();
  services.sort((a, b) => Number(b.name.toLowerCase().startsWith(lower)) - Number(a.name.toLowerCase().startsWith(lower)));

  const categories = categoryId
    ? []
    : await prisma.serviceCategory.findMany({
        where: { isActive: true, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true, iconUrl: true, _count: { select: { services: true } } },
        take: 5,
      });

  return { query: q, services: services.map(shape), categories };
}

// Shown when the search box is focused but still empty.
export async function discover() {
  const [popular, categories] = await Promise.all([
    popularServices(6),
    prisma.serviceCategory.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, iconUrl: true },
    }),
  ]);
  return {
    popular: popular.map(({ id, name, slug, iconUrl, category }) => ({ id, name, slug, iconUrl, category })),
    categories,
  };
}
