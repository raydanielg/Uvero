import { prisma } from "../../config/prisma.js";
import { broadcastToUser } from "../../realtime/broadcaster.js";

function render(template, variables = {}) {
  const fill = (text) =>
    text.replace(/\{(\w+)\}/g, (match, key) => (variables[key] != null ? String(variables[key]) : match));
  return { title: fill(template.title), body: fill(template.body) };
}

// Fire-and-forget: writes the notification (and a log row) synchronously.
// TODO once BullMQ/Redis is wired up: push this onto the `notifications`
// queue instead of writing inline, so a slow SMS/push provider never blocks
// the request that triggered it.
export async function notify(userId, templateKey, variables = {}, channel) {
  const template = await prisma.notificationTemplate.findUnique({ where: { key: templateKey } });

  const { title, body } = template
    ? render(template, variables)
    : { title: templateKey, body: JSON.stringify(variables) };

  const notification = await prisma.notification.create({
    data: {
      userId,
      templateKey,
      channel: channel ?? template?.channel ?? "IN_APP",
      title,
      body,
      data: variables,
      status: "SENT",
      sentAt: new Date(),
    },
  });

  await prisma.notificationLog.create({
    data: { notificationId: notification.id, status: "SENT" },
  });

  broadcastToUser(userId, "notification:new", notification);
  return notification;
}

export async function listMine(userId, { unreadOnly = false } = {}) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markRead(userId, id) {
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date(), status: "READ" },
  });
}

export async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date(), status: "READ" },
  });
}
