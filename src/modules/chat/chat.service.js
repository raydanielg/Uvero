import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { broadcastToRoom } from "../../realtime/broadcaster.js";

export async function getOrCreateJobConversation(jobId, requesterId) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.customerId !== requesterId && job.provider.userId !== requesterId) throw ApiError.forbidden();

  const existing = await prisma.conversation.findFirst({ where: { jobId } });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      jobId,
      type: "DIRECT",
      members: {
        create: [{ userId: job.customerId }, { userId: job.provider.userId }],
      },
    },
  });
}

export async function sendMessage(conversationId, senderId, { body, attachmentUrl }) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!member) throw ApiError.forbidden("Not a member of this conversation");

  const message = await prisma.message.create({ data: { conversationId, senderId, body, attachmentUrl } });
  broadcastToRoom(`conversation:${conversationId}`, "chat:message", message);
  return message;
}

export async function listMessages(conversationId, requesterId, { skip, take } = {}) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: requesterId } },
  });
  if (!member) throw ApiError.forbidden("Not a member of this conversation");

  const [rows, total] = await Promise.all([
    prisma.message.findMany({ where: { conversationId }, orderBy: { sentAt: "asc" }, skip, take }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: requesterId } },
    data: { lastReadAt: new Date() },
  });

  return { rows, total };
}

export async function listMyConversations(userId) {
  return prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
}
