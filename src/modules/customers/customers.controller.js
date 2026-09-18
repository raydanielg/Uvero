import * as customersService from "./customers.service.js";

export async function getMyProfile(req, res) {
  const profile = await customersService.getOrCreateProfile(req.user.id);
  res.json({ success: true, data: profile });
}

export async function updateMyProfile(req, res) {
  const profile = await customersService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: profile });
}

export async function listAddresses(req, res) {
  const addresses = await customersService.listAddresses(req.user.id);
  res.json({ success: true, data: addresses });
}

export async function addAddress(req, res) {
  const address = await customersService.addAddress(req.user.id, req.body);
  res.status(201).json({ success: true, data: address });
}

export async function updateAddress(req, res) {
  const address = await customersService.updateAddress(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: address });
}

export async function deleteAddress(req, res) {
  await customersService.deleteAddress(req.user.id, req.params.id);
  res.json({ success: true, message: "Address deleted" });
}
