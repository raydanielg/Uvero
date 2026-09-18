import { prisma } from "../../config/prisma.js";
import { getBranding } from "../branding/branding.service.js";
import { getPublicFlags } from "../feature-flags/feature-flags.service.js";
import { getPublicSettings } from "../settings/settings.service.js";

// The one endpoint every client app (customer/provider) calls on boot so
// nothing about app name, colors, enabled features or payment methods is
// hardcoded into the mobile builds — change it in the admin panel instead.
export async function getPublicConfig(_req, res) {
  const [branding, features, settings, categories, paymentIntegrations, legalDocuments] =
    await Promise.all([
      getBranding(),
      getPublicFlags(),
      getPublicSettings(),
      prisma.serviceCategory.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
          },
        },
      }),
      prisma.integrationConfig.findMany({
        where: { category: "PAYMENT", isEnabled: true },
        select: { code: true, name: true },
      }),
      prisma.legalDocument.findMany({
        distinct: ["type"],
        orderBy: { effectiveAt: "desc" },
        select: { type: true, version: true, effectiveAt: true },
      }),
    ]);

  res.json({
    success: true,
    data: {
      app: { name: branding.appName },
      branding,
      features,
      settings,
      categories,
      paymentMethods: paymentIntegrations,
      legal: legalDocuments,
    },
  });
}
