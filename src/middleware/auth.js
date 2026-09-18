import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

// Requires a valid Bearer access token. Attaches req.user.
export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw ApiError.unauthorized("Missing Bearer token");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        name: true,
        userType: true,
        isPhoneVerified: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) throw ApiError.unauthorized("Account no longer exists");

    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized("Invalid or expired token"));
  }
}

// Restricts a route to specific user types. Usage: restrictTo("PROVIDER", "ADMIN")
export function restrictTo(...userTypes) {
  return (req, _res, next) => {
    if (!req.user || !userTypes.includes(req.user.userType)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
}
