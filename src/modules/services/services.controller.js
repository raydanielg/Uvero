import * as categoriesService from "./categories.service.js";
import * as servicesService from "./services.service.js";
import * as pricingRulesService from "./pricing-rules.service.js";
import { estimatePrice } from "./pricing.engine.js";

export async function listCategories(req, res) {
  const categories = await categoriesService.listCategories({
    includeInactive: req.query.includeInactive === "true",
  });
  res.json({ success: true, data: categories });
}

export async function getCategory(req, res) {
  const category = await categoriesService.getCategory(req.params.id);
  res.json({ success: true, data: category });
}

export async function createCategory(req, res) {
  const category = await categoriesService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req, res) {
  const category = await categoriesService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: category });
}

export async function deleteCategory(req, res) {
  await categoriesService.deleteCategory(req.params.id);
  res.json({ success: true, message: "Category deleted" });
}

export async function listServices(req, res) {
  const services = await servicesService.listServices({
    categoryId: req.query.categoryId,
    includeInactive: req.query.includeInactive === "true",
  });
  res.json({ success: true, data: services });
}

export async function getService(req, res) {
  const service = await servicesService.getService(req.params.id);
  res.json({ success: true, data: service });
}

export async function createService(req, res) {
  const service = await servicesService.createService(req.body);
  res.status(201).json({ success: true, data: service });
}

export async function updateService(req, res) {
  const service = await servicesService.updateService(req.params.id, req.body);
  res.json({ success: true, data: service });
}

export async function deleteService(req, res) {
  await servicesService.deleteService(req.params.id);
  res.json({ success: true, message: "Service deleted" });
}

export async function estimate(req, res) {
  const result = await estimatePrice(req.params.id, req.query);
  res.json({ success: true, data: result });
}

export async function listPricingRules(req, res) {
  const rules = await pricingRulesService.listRules(req.params.id);
  res.json({ success: true, data: rules });
}

export async function createPricingRule(req, res) {
  const rule = await pricingRulesService.createRule(req.params.id, req.body);
  res.status(201).json({ success: true, data: rule });
}

export async function updatePricingRule(req, res) {
  const rule = await pricingRulesService.updateRule(req.params.ruleId, req.body);
  res.json({ success: true, data: rule });
}

export async function deletePricingRule(req, res) {
  await pricingRulesService.deleteRule(req.params.ruleId);
  res.json({ success: true, message: "Pricing rule deleted" });
}
