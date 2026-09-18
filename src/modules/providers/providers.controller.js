import * as providersService from "./providers.service.js";

export async function getMyProfile(req, res) {
  const profile = await providersService.getOrCreateProfile(req.user.id);
  res.json({ success: true, data: profile });
}

export async function updateMyProfile(req, res) {
  const profile = await providersService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: profile });
}

export async function setAvailability(req, res) {
  const profile = await providersService.setAvailability(req.user.id, req.body.status);
  res.json({ success: true, data: profile });
}

export async function updateLocation(req, res) {
  const location = await providersService.updateLocation(req.user.id, req.body);
  res.json({ success: true, data: location });
}

export async function setServiceArea(req, res) {
  const area = await providersService.setServiceArea(req.user.id, req.body);
  res.status(201).json({ success: true, data: area });
}

export async function setServices(req, res) {
  const profile = await providersService.setServices(req.user.id, req.body.serviceIds);
  res.json({ success: true, data: profile });
}

export async function addDocument(req, res) {
  const document = await providersService.addDocument(req.user.id, req.body);
  res.status(201).json({ success: true, data: document });
}

export async function listMyDocuments(req, res) {
  const profile = await providersService.getOrCreateProfile(req.user.id);
  const documents = await providersService.listDocuments(profile.id);
  res.json({ success: true, data: documents });
}

export async function getProfileById(req, res) {
  const profile = await providersService.getProfileById(req.params.id);
  res.json({ success: true, data: profile });
}

export async function reviewDocument(req, res) {
  const document = await providersService.reviewDocument(
    req.params.documentId,
    req.body,
    req.user.id,
    req,
  );
  res.json({ success: true, data: document });
}

export async function suspend(req, res) {
  const suspension = await providersService.suspend(req.params.id, req.body, req.user.id, req);
  res.status(201).json({ success: true, data: suspension });
}

export async function liftSuspension(req, res) {
  const suspension = await providersService.liftSuspension(
    req.params.suspensionId,
    req.user.id,
    req,
  );
  res.json({ success: true, data: suspension });
}

export async function warn(req, res) {
  const warning = await providersService.warn(req.params.id, req.body, req.user.id);
  res.status(201).json({ success: true, data: warning });
}
