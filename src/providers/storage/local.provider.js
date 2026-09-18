import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.resolve(__dirname, "../../../uploads");

function safeExt(originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

export const localStorage = {
  code: "local",
  async upload(buffer, { originalName, folder = "misc" } = {}) {
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
    const dir = path.join(UPLOADS_ROOT, safeFolder);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${crypto.randomUUID()}${safeExt(originalName)}`;
    await fs.writeFile(path.join(dir, filename), buffer);

    return { url: `/uploads/${safeFolder}/${filename}`, path: `${safeFolder}/${filename}` };
  },

  async delete(relativePath) {
    await fs.rm(path.join(UPLOADS_ROOT, relativePath), { force: true });
  },
};

export { UPLOADS_ROOT };
