import * as notificationsService from "./notifications.service.js";

export async function listMine(req, res) {
  const notifications = await notificationsService.listMine(req.user.id, {
    unreadOnly: req.query.unreadOnly === "true",
  });
  res.json({ success: true, data: notifications });
}

export async function markRead(req, res) {
  await notificationsService.markRead(req.user.id, req.params.id);
  res.json({ success: true, message: "Marked as read" });
}

export async function markAllRead(req, res) {
  await notificationsService.markAllRead(req.user.id);
  res.json({ success: true, message: "All notifications marked as read" });
}
