import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as notificationsService from "./notifications.service.js";

export async function listMine(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total, unread } = await notificationsService.listMine(req.user.id, {
    unreadOnly: req.query.unreadOnly === "true",
    skip,
    take,
  });
  res.json({ success: true, data: rows, meta: { ...paginationMeta({ page, limit, total }), unread } });
}

export async function unreadCount(req, res) {
  res.json({ success: true, data: { unread: await notificationsService.unreadCount(req.user.id) } });
}

export async function markRead(req, res) {
  await notificationsService.markRead(req.user.id, req.params.id);
  res.json({ success: true, message: "Marked as read" });
}

export async function markAllRead(req, res) {
  await notificationsService.markAllRead(req.user.id);
  res.json({ success: true, message: "All notifications marked as read" });
}

export async function remove(req, res) {
  await notificationsService.remove(req.user.id, req.params.id);
  res.json({ success: true, message: "Notification deleted" });
}

export async function clearAll(req, res) {
  await notificationsService.clearAll(req.user.id);
  res.json({ success: true, message: "All notifications cleared" });
}
