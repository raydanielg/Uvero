import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listRules(serviceId) {
  return prisma.pricingRule.findMany({ where: { serviceId }, orderBy: { createdAt: "asc" } });
}

export async function createRule(serviceId, data) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw ApiError.notFound("Service not found");
  return prisma.pricingRule.create({ data: { ...data, serviceId } });
}

export async function updateRule(id, data) {
  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  if (!rule) throw ApiError.notFound("Pricing rule not found");
  return prisma.pricingRule.update({ where: { id }, data });
}

export async function deleteRule(id) {
  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  if (!rule) throw ApiError.notFound("Pricing rule not found");
  await prisma.pricingRule.delete({ where: { id } });
}
