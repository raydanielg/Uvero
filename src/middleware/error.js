import { ApiError } from "../utils/ApiError.js";
import { isProd } from "../config/env.js";

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof ApiError || !isProd ? err.message : "Internal server error";

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    ...(err instanceof ApiError && err.details ? { errors: err.details } : {}),
    ...(!isProd && status >= 500 ? { stack: err.stack } : {}),
  });
}
