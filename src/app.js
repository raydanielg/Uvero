import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env, isProd } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { apiRouter } from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Root → service info
app.get("/", (_req, res) =>
  res.json({
    name: "Uvero API",
    version: "1.0.0",
    docs: "/api/docs",
    health: "/api/v1/health",
  }),
);

// Swagger docs — dark themed
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Uvero API Docs",
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(90deg, #6D28D9, #00B8D4); }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      body { background: #0f1117; }
      .swagger-ui { filter: invert(0.9) hue-rotate(180deg) saturate(0.7); }
      .swagger-ui img { filter: invert(1) hue-rotate(180deg); }
      .swagger-ui .highlight-code, .swagger-ui .microlight,
      .swagger-ui pre, .swagger-ui code { filter: invert(1) hue-rotate(180deg); }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

// API v1
app.use("/api/v1", apiLimiter, apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
