// Plaintext OTPs live only in process memory (never in the database) so the
// monitor can show them without weakening what is stored at rest.
const MAX = 500;
const codes = new Map(); // otpId -> code

export function rememberOtp(id, code) {
  codes.set(id, code);
  if (codes.size > MAX) codes.delete(codes.keys().next().value);
}

export function recallOtp(id) {
  return codes.get(id) ?? null;
}
