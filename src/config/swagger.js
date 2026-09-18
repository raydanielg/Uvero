import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Uvero API",
    version: "1.0.0",
    description:
      "Backend API for the Uvero platform — customers book services, providers deliver them. " +
      "Authentication is passwordless: phone number + OTP.",
    contact: { name: "Uvero Engineering" },
  },
  servers: [
    { url: `http://localhost:${env.PORT}/api/v1`, description: "Local" },
  ],
  tags: [
    { name: "Auth", description: "Phone number + OTP authentication" },
    { name: "Health", description: "Service status" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token returned by /auth/otp/verify",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx9k2m4p0000abcd1234efgh" },
          phone: { type: "string", example: "+255712345678" },
          name: { type: "string", nullable: true, example: "Katani Adam" },
          role: {
            type: "string",
            enum: ["CUSTOMER", "PROVIDER", "ADMIN"],
            example: "CUSTOMER",
          },
          isVerified: { type: "boolean", example: true },
          avatarUrl: { type: "string", nullable: true, example: null },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          expiresIn: {
            type: "string",
            example: "15m",
            description: "Access token lifetime",
          },
        },
      },
      RequestOtpBody: {
        type: "object",
        required: ["phone"],
        properties: {
          phone: {
            type: "string",
            example: "+255712345678",
            description: "E.164 or Tanzanian local format (0712...)",
          },
        },
      },
      VerifyOtpBody: {
        type: "object",
        required: ["phone", "code"],
        properties: {
          phone: { type: "string", example: "+255712345678" },
          code: {
            type: "string",
            example: "482913",
            description: "6-digit code sent via SMS",
          },
          name: {
            type: "string",
            example: "Katani Adam",
            description: "Display name — only used on first sign-up",
          },
          role: {
            type: "string",
            enum: ["CUSTOMER", "PROVIDER"],
            example: "CUSTOMER",
            description: "Account type — only used on first sign-up",
          },
        },
      },
      RefreshBody: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description:
              "Optional if the refreshToken httpOnly cookie is present",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: ["./src/modules/**/*.routes.js", "./src/routes/**/*.js"],
});
