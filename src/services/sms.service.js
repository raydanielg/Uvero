import { env, isProd } from "../config/env.js";

// OTP delivery. Logs to console in development — plug in a real provider
// (Africa's Talking, Beem, Twilio) here when going live.
export async function sendOtpSms(phone, code) {
  if (isProd) {
    // TODO: integrate SMS provider, e.g. Africa's Talking:
    // await africastalking.SMS.send({ to: phone, message: `Your Uvero code is ${code}` });
    console.log(`[sms] OTP for ${phone}: ${code} (provider not configured)`);
    return;
  }

  const ttl = env.OTP_TTL_MINUTES;
  console.log("┌─────────────────────────────────────────────┐");
  console.log(`│  SMS → ${phone.padEnd(34)}│`);
  console.log(`│  Uvero code: ${code} (expires ${ttl} min)`.padEnd(46) + "│");
  console.log("└─────────────────────────────────────────────┘");
}
