import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function createTicket(userId, { subject, category, priority }) {
  return prisma.supportTicket.create({ data: { userId, subject, category, priority } });
}

export async function addMessage(ticketId, senderId, { body, attachmentUrl }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  if (ticket.userId !== senderId && ticket.assignedTo !== senderId) throw ApiError.forbidden();

  return prisma.supportMessage.create({ data: { ticketId, senderId, body, attachmentUrl } });
}

export async function getTicket(id, requesterId) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { sentAt: "asc" } } },
  });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  if (requesterId && ticket.userId !== requesterId && ticket.assignedTo !== requesterId) {
    throw ApiError.forbidden();
  }
  return ticket;
}

export async function listMine(userId) {
  return prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function listAll({ status } = {}, { skip, take } = {}) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.supportTicket.count({ where }),
  ]);
  return { rows, total };
}

export async function assign(ticketId, assignedTo) {
  return prisma.supportTicket.update({ where: { id: ticketId }, data: { assignedTo, status: "IN_PROGRESS" } });
}

export async function updateStatus(ticketId, status) {
  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : undefined },
  });
}
