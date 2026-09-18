const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m", red: "\x1b[31m",
  magenta: "\x1b[35m", blue: "\x1b[34m", gray: "\x1b[90m",
};

const methodColor = { GET: c.green, POST: c.cyan, PUT: c.yellow, PATCH: c.magenta, DELETE: c.red };

function statusColor(s) {
  if (s >= 500) return c.red;
  if (s >= 400) return c.yellow;
  if (s >= 300) return c.cyan;
  return c.green;
}

// Pretty one-line-per-request log for development terminals.
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const url = req.originalUrl.split("?")[0];
    if (url.startsWith("/admin/otp-monitor/data")) return; // polled every 2s — too noisy
    const time = new Date().toLocaleTimeString("en-GB");
    const who = req.user?.id ? `${c.gray} user:${req.user.id.slice(-6)}${c.reset}` : "";
    const query = req.originalUrl.includes("?") ? `${c.gray}?${req.originalUrl.split("?")[1]}${c.reset}` : "";
    console.log(
      `${c.gray}${time}${c.reset} ` +
        `${methodColor[req.method] ?? c.blue}${c.bold}${req.method.padEnd(6)}${c.reset}` +
        `${url}${query} ` +
        `${statusColor(res.statusCode)}${c.bold}${res.statusCode}${c.reset} ` +
        `${c.dim}${ms.toFixed(1)}ms${c.reset}${who}`,
    );
  });
  next();
}
