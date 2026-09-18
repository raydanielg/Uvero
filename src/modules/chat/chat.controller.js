import { parsePagination, paginationMeta } from "../../core/pagination/paginate.js";
import * as chatService from "./chat.service.js";

export async function openJobConversation(req, res) {
  const conversation = await chatService.getOrCreateJobConversation(req.params.jobId, req.user.id);
  res.json({ success: true, data: conversation });
}

export async function sendMessage(req, res) {
  const message = await chatService.sendMessage(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: message });
}

export async function listMessages(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { rows, total } = await chatService.listMessages(req.params.id, req.user.id, { skip, take });
  res.json({ success: true, data: rows, meta: paginationMeta({ page, limit, total }) });
}

export async function listMine(req, res) {
  const conversations = await chatService.listMyConversations(req.user.id);
  res.json({ success: true, data: conversations });
}
