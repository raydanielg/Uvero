import { env, isProd } from "../config/env.js";

const G = "\x1b[32m", M = "\x1b[35m", B = "\x1b[1m", D = "\x1b[2m", R = "\x1b[0m";

// OTP delivery. Prints a highlighted box in development — plug in a real
// provider (Africa's Talking, Beem, Twilio) here when going live.
export async function sendOtpSms(phone, code) {
  if (isProd) {
    // TODO: integrate SMS provider, e.g. Africa's Talking:
    // await africastalking.SMS.send({ to: phone, message: `Your Uvero code is ${code}` });
    console.log(`[sms] OTP requested for ${phone} (provider not configured)`);
    return;
  }

  const line = "─".repeat(44);
  console.log(`\n${M}┌${line}┐${R}`);
  console.log(`${M}│${R} ${B}📩 OTP SMS${R}${" ".repeat(33)}${M}│${R}`);
  console.log(`${M}│${R} ${D}Kwa:${R}   ${phone.padEnd(37)}${M}│${R}`);
  console.log(`${M}│${R} ${D}Msimbo:${R} ${G}${B}${code}${R}${" ".repeat(Math.max(0, 34 - code.length))}${M}│${R}`);
  console.log(`${M}│${R} ${D}Huisha:${R} dakika ${String(env.OTP_TTL_MINUTES).padEnd(28)}${M}│${R}`);
  console.log(`${M}└${line}┘${R}\n`);
}
