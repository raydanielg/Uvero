import { ApiError } from "../../utils/ApiError.js";
import * as customersService from "./customers.service.js";

export async function getMe(req, res) {
  res.json({ success: true, data: await customersService.getMe(req.user.id) });
}

export async function updateMe(req, res) {
  res.json({ success: true, data: await customersService.updateMe(req.user.id, req.body) });
}

export async function setAvatar(req, res) {
  if (!req.file) throw ApiError.badRequest("Send an image in the `file` field (jpeg, png, webp or gif, max 5MB)");
  res.json({ success: true, data: await customersService.setAvatar(req.user.id, req.file) });
}

export async function removeAvatar(req, res) {
  res.json({ success: true, data: await customersService.removeAvatar(req.user.id) });
}

export async function deleteAccount(req, res) {
  await customersService.deleteAccount(req.user.id);
  res.json({ success: true, message: "Your account has been deleted" });
}

export async function home(req, res) {
  res.json({ success: true, data: await customersService.getHome(req.user.id) });
}

export async function activity(req, res) {
  res.json({ success: true, data: await customersService.getActivity(req.user.id, req.query) });
}

export async function legalStatus(req, res) {
  res.json({ success: true, data: await customersService.getLegalStatus(req.user.id) });
}

export async function acceptLegal(req, res) {
  res.json({ success: true, data: await customersService.acceptLegal(req.user.id, req.body, req.ip) });
}

export async function listAddresses(req, res) {
  res.json({ success: true, data: await customersService.listAddresses(req.user.id) });
}

export async function addAddress(req, res) {
  res.status(201).json({ success: true, data: await customersService.addAddress(req.user.id, req.body) });
}

export async function updateAddress(req, res) {
  res.json({ success: true, data: await customersService.updateAddress(req.user.id, req.params.id, req.body) });
}

export async function deleteAddress(req, res) {
  await customersService.deleteAddress(req.user.id, req.params.id);
  res.json({ success: true, message: "Address deleted" });
}
