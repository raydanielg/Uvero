import { ApiError } from "../../utils/ApiError.js";
import { getStorageProvider } from "../../providers/storage/index.js";

const ALLOWED_FOLDERS = new Set(["documents", "avatars", "ads", "content", "attachments"]);

export async function upload(req, res) {
  if (!req.file) throw ApiError.badRequest("No file uploaded (field name: file)");

  const folder = ALLOWED_FOLDERS.has(req.body.folder) ? req.body.folder : "misc";
  const storage = getStorageProvider();
  const result = await storage.upload(req.file.buffer, {
    originalName: req.file.originalname,
    folder,
  });

  res.status(201).json({
    success: true,
    data: { url: result.url, size: req.file.size, mimeType: req.file.mimetype },
  });
}
