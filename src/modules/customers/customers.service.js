import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function getOrCreateProfile(userId) {
  const existing = await prisma.customerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.customerProfile.create({ data: { userId } });
}

export async function updateProfile(userId, data) {
  await getOrCreateProfile(userId);
  return prisma.customerProfile.update({ where: { userId }, data });
}

export async function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function addAddress(userId, data) {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...data, userId } });
}

export async function updateAddress(userId, addressId, data) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound("Address not found");

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id: addressId }, data });
}

export async function deleteAddress(userId, addressId) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound("Address not found");
  await prisma.address.delete({ where: { id: addressId } });
}
