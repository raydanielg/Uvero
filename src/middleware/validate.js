import { ApiError } from "../utils/ApiError.js";

// Validates req[source] against a zod schema and replaces it with the
// parsed (normalized) value. Usage: validate(schema) or validate(schema, "query").
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }
    // Express 5 makes `req.query` a getter-only accessor, so it can't be
    // reassigned directly like `req.body`/`req.params` — redefine it instead.
    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
