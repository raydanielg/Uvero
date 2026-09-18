import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../core/audit/audit.js";
import { invalidateUserPermissions } from "../../core/permissions/rbac.js";

const roleInclude = { rolePermissions: { include: { permission: true } } };

function serializeRole(role) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp) => rp.permission.key),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export async function listRoles() {
  const roles = await prisma.role.findMany({ include: roleInclude, orderBy: { name: "asc" } });
  return roles.map(serializeRole);
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
}

export async function createRole({ name, description, permissionKeys = [] }, actorId, req) {
  const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });

  const role = await prisma.role.create({
    data: {
      name,
      description,
      rolePermissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
    include: roleInclude,
  });

  await recordAudit({
    actorId,
    action: "CREATED_ROLE",
    entityType: "Role",
    entityId: role.id,
    newValue: { name, permissionKeys },
    req,
  });

  return serializeRole(role);
}

export async function setRolePermissions(roleId, permissionKeys, actorId, req) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be modified");

  const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  const before = role.rolePermissions.map((rp) => rp.permission.key);

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    }),
  ]);

  const usersWithRole = await prisma.userRole.findMany({ where: { roleId }, select: { userId: true } });
  usersWithRole.forEach((ur) => invalidateUserPermissions(ur.userId));

  await recordAudit({
    actorId,
    action: "UPDATED_ROLE_PERMISSIONS",
    entityType: "Role",
    entityId: roleId,
    oldValue: { permissions: before },
    newValue: { permissions: permissionKeys },
    req,
  });

  const updated = await prisma.role.findUnique({ where: { id: roleId }, include: roleInclude });
  return serializeRole(updated);
}

export async function assignRole(userId, roleId, actorId, req) {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw ApiError.notFound("User not found");
  if (!role) throw ApiError.notFound("Role not found");

  const userRole = await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId, assignedBy: actorId },
  });

  invalidateUserPermissions(userId);
  await recordAudit({
    actorId,
    action: "ASSIGNED_ROLE",
    entityType: "User",
    entityId: userId,
    newValue: { roleId, roleName: role.name },
    req,
  });

  return userRole;
}

export async function revokeRole(userId, roleId, actorId, req) {
  await prisma.userRole.deleteMany({ where: { userId, roleId } });
  invalidateUserPermissions(userId);
  await recordAudit({
    actorId,
    action: "REVOKED_ROLE",
    entityType: "User",
    entityId: userId,
    oldValue: { roleId },
    req,
  });
}

export async function listUserRoles(userId) {
  const userRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
  return userRoles.map((ur) => ur.role);
}
