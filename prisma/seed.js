import { prisma } from "../src/config/prisma.js";
import { PERMISSIONS } from "../src/core/permissions/catalog.js";

async function seedPermissionsAndRoles() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { module: permission.module, description: permission.description },
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const superAdmin = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Full platform access", isSystem: true },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdmin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: superAdmin.id, permissionId: p.id })),
  });

  const roleDefinitions = [
    {
      name: "FINANCE",
      description: "Payments, withdrawals and wallet oversight",
      permissionKeys: ["payments.view", "payments.refund", "withdrawals.view", "withdrawals.approve", "reports.view"],
    },
    {
      name: "SUPPORT",
      description: "Handles support tickets and disputes",
      permissionKeys: ["support.manage", "disputes.manage", "users.view", "requests.view"],
    },
    {
      name: "KYC_OFFICER",
      description: "Reviews provider documents and KYC submissions",
      permissionKeys: ["kyc.review", "providers.view", "providers.verify"],
    },
    {
      name: "OPERATIONS",
      description: "Day-to-day marketplace operations",
      permissionKeys: [
        "requests.view",
        "requests.cancel",
        "requests.assign",
        "providers.view",
        "providers.suspend",
        "services.manage",
      ],
    },
    {
      name: "CONTENT_MANAGER",
      description: "Manages content, ads and branding",
      permissionKeys: ["content.manage", "ads.manage", "branding.update"],
    },
  ];

  for (const def of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: { description: def.description },
      create: { name: def.name, description: def.description },
    });
    const permissions = allPermissions.filter((p) => def.permissionKeys.includes(p.key));
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }
}

async function seedSettings() {
  const settings = [
    // General
    ["general.support_email", "support@uvero.co.tz", "STRING", "general", true],
    ["general.support_phone", "+255700000000", "STRING", "general", true],
    ["general.default_currency", "TZS", "STRING", "general", true],
    ["general.default_timezone", "Africa/Dar_es_Salaam", "STRING", "general", true],

    // Business / pricing
    ["pricing.platform_commission", "10", "NUMBER", "pricing", false],
    ["pricing.minimum_fare", "3000", "NUMBER", "pricing", true],
    ["pricing.cancellation_fee", "2000", "NUMBER", "pricing", true],

    // Matching
    ["matching.search_radius", "5", "NUMBER", "matching", false],
    ["matching.max_providers", "5", "NUMBER", "matching", false],
    ["matching.provider_timeout", "30", "NUMBER", "matching", false],

    // Provider
    ["provider.require_verification", "true", "BOOLEAN", "provider", false],
    ["provider.auto_offline_minutes", "30", "NUMBER", "provider", false],

    // Customer
    ["customer.max_active_requests", "3", "NUMBER", "customer", false],
    ["customer.allow_guest_request", "false", "BOOLEAN", "customer", false],

    // Payments
    ["payments.cash_enabled", "true", "BOOLEAN", "payments", true],
    ["payments.mobile_money_enabled", "false", "BOOLEAN", "payments", true],

    // Notifications
    ["notifications.push_enabled", "true", "BOOLEAN", "notifications", false],
    ["notifications.sms_enabled", "false", "BOOLEAN", "notifications", false],
  ];

  for (const [key, value, valueType, category, isPublic] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value, valueType, category, isPublic },
    });
  }
}

async function seedFeatureFlags() {
  const flags = [
    ["chat", "In-app chat", true],
    ["wallet", "Provider wallet", true],
    ["card_payment", "Card payments", false],
    ["scheduled_requests", "Schedule a request for later", false],
    ["ads", "In-app ads", true],
    ["international_services", "Services outside Tanzania", false],
  ];
  for (const [key, name, isEnabled] of flags) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: {},
      create: { key, name, isEnabled },
    });
  }
}

async function seedBranding() {
  await prisma.branding.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      appName: "Uvero",
      primaryColor: "#0F62FE",
      supportEmail: "support@uvero.co.tz",
    },
  });
}

async function seedIntegrations() {
  const integrations = [
    ["cash", "PAYMENT", "Cash", true],
    ["mock", "PAYMENT", "Mock Gateway (dev only)", true],
    ["selcom", "PAYMENT", "Selcom", false],
    ["azampay", "PAYMENT", "AzamPay", false],
    ["mock_sms", "SMS", "Mock SMS (dev only)", true],
    ["google_maps", "MAPS", "Google Maps", false],
    ["local_storage", "STORAGE", "Local disk storage", true],
  ];
  for (const [code, category, name, isEnabled] of integrations) {
    await prisma.integrationConfig.upsert({
      where: { code },
      update: {},
      create: { code, category, name, isEnabled },
    });
  }
}

async function seedNotificationTemplates() {
  const templates = [
    ["new_request_available", "PUSH", "New job nearby", "A new service request is available near you."],
    ["provider_accepted", "PUSH", "Provider found", "Your provider has accepted your request."],
    ["job_completed", "PUSH", "Job completed", "Your job has been marked as completed. Please rate your provider."],
    ["quote_received", "PUSH", "New quote", "You received a quote of {amount} for your request."],
    ["kyc_approved", "PUSH", "Verification approved", "Your provider documents have been approved."],
    ["kyc_rejected", "PUSH", "Verification rejected", "Your provider documents were rejected: {note}"],
    ["withdrawal_approved", "PUSH", "Withdrawal approved", "Your withdrawal of {amount} has been approved."],
    ["withdrawal_rejected", "PUSH", "Withdrawal rejected", "Your withdrawal of {amount} was rejected: {note}"],
  ];
  for (const [key, channel, title, body] of templates) {
    await prisma.notificationTemplate.upsert({
      where: { key },
      update: {},
      create: { key, channel, title, body },
    });
  }
}

async function seedCatalog() {
  const towing = await prisma.serviceCategory.upsert({
    where: { slug: "towing" },
    update: {},
    create: { name: "Towing", slug: "towing", sortOrder: 1 },
  });
  const homeServices = await prisma.serviceCategory.upsert({
    where: { slug: "home-services" },
    update: {},
    create: { name: "Home Services", slug: "home-services", sortOrder: 2 },
  });

  const emergencyTowing = await prisma.service.upsert({
    where: { slug: "emergency-towing" },
    update: {},
    create: { categoryId: towing.id, name: "Emergency Towing", slug: "emergency-towing" },
  });
  const cleaning = await prisma.service.upsert({
    where: { slug: "house-cleaning" },
    update: {},
    create: { categoryId: homeServices.id, name: "House Cleaning", slug: "house-cleaning" },
  });
  const plumbing = await prisma.service.upsert({
    where: { slug: "plumbing" },
    update: {},
    create: { categoryId: homeServices.id, name: "Plumbing", slug: "plumbing" },
  });

  const existingRules = await prisma.pricingRule.findMany({
    where: { serviceId: { in: [emergencyTowing.id, cleaning.id, plumbing.id] }, region: null },
  });
  const hasRule = (serviceId) => existingRules.some((r) => r.serviceId === serviceId);

  if (!hasRule(emergencyTowing.id)) {
    await prisma.pricingRule.create({
      data: {
        serviceId: emergencyTowing.id,
        pricingType: "DISTANCE",
        basePrice: 5000,
        pricePerKm: 1500,
        minimumPrice: 10000,
      },
    });
  }
  if (!hasRule(cleaning.id)) {
    await prisma.pricingRule.create({
      data: { serviceId: cleaning.id, pricingType: "FIXED", basePrice: 25000 },
    });
  }
  if (!hasRule(plumbing.id)) {
    await prisma.pricingRule.create({ data: { serviceId: plumbing.id, pricingType: "QUOTE" } });
  }
}

async function seedLegalDocuments() {
  const docs = [
    ["TERMS", "1.0", "<h1>Terms of Service</h1><p>Placeholder terms — replace via the admin panel.</p>"],
    ["PRIVACY", "1.0", "<h1>Privacy Policy</h1><p>Placeholder privacy policy — replace via the admin panel.</p>"],
  ];
  for (const [type, version, bodyHtml] of docs) {
    const existing = await prisma.legalDocument.findUnique({ where: { type_version: { type, version } } });
    if (!existing) {
      await prisma.legalDocument.create({ data: { type, version, bodyHtml } });
    }
  }
}

async function main() {
  await seedPermissionsAndRoles();
  await seedSettings();
  await seedFeatureFlags();
  await seedBranding();
  await seedIntegrations();
  await seedNotificationTemplates();
  await seedCatalog();
  await seedLegalDocuments();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
