import { prisma } from "../../config/prisma.js";

// Resolves the most specific rule first: a region-specific rule beats the
// service's default (region: null) rule.
export async function resolvePricingRule(serviceId, region) {
  if (region) {
    const regional = await prisma.pricingRule.findFirst({
      where: { serviceId, region, isActive: true },
    });
    if (regional) return regional;
  }
  return prisma.pricingRule.findFirst({ where: { serviceId, region: null, isActive: true } });
}

// Pure function — no I/O — so it can be unit-tested without a database.
export function computePrice(rule, { distanceKm = 0, durationHours = 0 } = {}) {
  if (!rule) return null;

  let amount;
  switch (rule.pricingType) {
    case "FIXED":
    case "STARTING_PRICE":
      amount = Number(rule.basePrice ?? 0);
      break;
    case "DISTANCE":
      amount = Number(rule.basePrice ?? 0) + Number(rule.pricePerKm ?? 0) * distanceKm;
      break;
    case "HOURLY":
      amount = Number(rule.basePrice ?? 0) + Number(rule.pricePerHour ?? 0) * durationHours;
      break;
    case "QUOTE":
      // No auto price — the provider must send a manual Quote.
      return null;
    default:
      amount = 0;
  }

  if (rule.minimumPrice != null) amount = Math.max(amount, Number(rule.minimumPrice));
  if (rule.maximumPrice != null) amount = Math.min(amount, Number(rule.maximumPrice));
  return Math.round(amount);
}

export async function estimatePrice(serviceId, { distanceKm, durationHours, region } = {}) {
  const rule = await resolvePricingRule(serviceId, region);
  return {
    rule,
    pricingType: rule?.pricingType ?? null,
    estimatedPrice: computePrice(rule, { distanceKm, durationHours }),
  };
}
