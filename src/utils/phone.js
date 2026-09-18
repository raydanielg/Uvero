import { ApiError } from "./ApiError.js";

const E164 = /^\+[1-9]\d{7,14}$/;
const TZ_PREFIX = "255";

// Normalizes phone numbers to E.164 (+255...).
// Accepts: "+255712345678", "0712345678", "255712345678", "712345678".
export function normalizePhone(raw) {
  let phone = String(raw).trim().replace(/[\s\-()]/g, "");

  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (phone.startsWith("0")) phone = `+${TZ_PREFIX}${phone.slice(1)}`;
  if (phone.startsWith(TZ_PREFIX)) phone = `+${phone}`;
  if (!phone.startsWith("+")) phone = `+${TZ_PREFIX}${phone}`;

  if (!E164.test(phone)) {
    throw ApiError.badRequest(
      "Invalid phone number. Use format +255712345678",
    );
  }
  return phone;
}
