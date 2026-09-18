import * as rolesService from "./roles.service.js";

export async function list(_req, res) {
  const roles = await rolesService.listRoles();
  res.json({ success: true, data: roles });
}

export async function listPermissions(_req, res) {
  const permissions = await rolesService.listPermissions();
  res.json({ success: true, data: permissions });
}

export async function create(req, res) {
  const role = await rolesService.createRole(req.body, req.user.id, req);
  res.status(201).json({ success: true, data: role });
}

export async function setPermissions(req, res) {
  const role = await rolesService.setRolePermissions(
    req.params.id,
    req.body.permissionKeys,
    req.user.id,
    req,
  );
  res.json({ success: true, data: role });
}

export async function assignToUser(req, res) {
  const userRole = await rolesService.assignRole(
    req.params.userId,
    req.body.roleId,
    req.user.id,
    req,
  );
  res.status(201).json({ success: true, data: userRole });
}

export async function revokeFromUser(req, res) {
  await rolesService.revokeRole(req.params.userId, req.params.roleId, req.user.id, req);
  res.json({ success: true, message: "Role revoked" });
}

export async function listForUser(req, res) {
  const roles = await rolesService.listUserRoles(req.params.userId);
  res.json({ success: true, data: roles });
}
