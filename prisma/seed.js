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
    [
      "TERMS",
      "1.0",
      `<h1>Terms &amp; Conditions</h1>
<p><em>Masharti na Vigezo · Last updated 2026</em></p>
<h2>1. About Uvero</h2>
<p>Uvero is a marketplace that connects customers with independent service providers (towing, cleaning, plumbing and more). Uvero is not the provider of these services.</p>
<h2>2. Your account</h2>
<p>You must be 18 or older and provide a valid phone number. You are responsible for activity on your account. Never share your OTP code with anyone.</p>
<h2>3. Requests &amp; pricing</h2>
<p>Prices shown are estimates. Some services are quoted by the provider after assessing the job. The final amount is confirmed before or after the work, as shown in the app.</p>
<h2>4. Payments</h2>
<p>You can pay in cash or through the payment methods enabled in the app. Uvero charges a platform commission to providers, not to you, unless a service fee is shown.</p>
<h2>5. Cancellations</h2>
<p>You may cancel a request before a provider starts work. Late cancellations may incur a cancellation fee shown in the app.</p>
<h2>6. Conduct</h2>
<p>Treat providers with respect. Abuse, fraud or misuse may lead to suspension of your account.</p>
<h2>7. Disputes</h2>
<p>If something goes wrong, open a dispute from your completed job and our team will review it.</p>
<h2>8. Contact</h2>
<p>Questions? Reach us through Support in the app.</p>`,
    ],
    [
      "PRIVACY",
      "1.0",
      `<h1>Privacy Policy</h1>
<p><em>Sera ya Faragha · Last updated 2026</em></p>
<h2>What we collect</h2>
<p>Your phone number, name, optional email and avatar, saved addresses, request and payment history, and your location when you create a request or track a provider.</p>
<h2>How we use it</h2>
<p>To match you with providers, process payments, send notifications, prevent fraud and improve the service.</p>
<h2>Who sees it</h2>
<p>A provider you are matched with sees your name, request details and job location. We never sell your personal data.</p>
<h2>Your choices</h2>
<p>You can edit your profile, remove your avatar, clear notifications and delete your account from the app at any time.</p>
<h2>Security</h2>
<p>Data is encrypted in transit and access is restricted. OTP codes are stored hashed.</p>`,
    ],
    [
      "REFUND_POLICY",
      "1.0",
      `<h1>Refund Policy</h1>
<p>If a provider does not show up or the work is not completed, you are not charged. If you paid electronically for work that was not delivered, open a dispute within 7 days and approved refunds are returned to your payment method.</p>`,
    ],
  ];
  for (const [type, version, bodyHtml] of docs) {
    const existing = await prisma.legalDocument.findUnique({ where: { type_version: { type, version } } });
    if (!existing) {
      await prisma.legalDocument.create({ data: { type, version, bodyHtml } });
    } else if (existing.bodyHtml.includes("Placeholder")) {
      await prisma.legalDocument.update({ where: { id: existing.id }, data: { bodyHtml } });
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
