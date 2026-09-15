import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z
  .string()
  .optional()
  .default("false")
  .transform((value) => value.toLowerCase() === "true");

const positiveIntegerFromEnv = z
  .string()
  .regex(/^\d+$/, "Must be a positive integer")
  .transform(Number);

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  APP_NAME: z
    .string()
    .min(1)
    .default("Inventory Management"),

  APP_VERSION: z
    .string()
    .min(1)
    .default("1.0.0"),

  APP_HOST: z
    .string()
    .min(1)
    .default("0.0.0.0"),

  APP_PORT: positiveIntegerFromEnv
    .default(4000),

  APP_URL: z
    .string()
    .url()
    .default("http://localhost:4000"),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  DATABASE_HOST: z
    .string()
    .min(1)
    .default("postgres"),

  DATABASE_PORT: positiveIntegerFromEnv
    .default(5432),

  DATABASE_NAME: z
    .string()
    .min(1)
    .default("inventory_management"),

  DATABASE_USER: z
    .string()
    .min(1)
    .default("inventory_app"),

  DATABASE_PASSWORD: z
    .string()
    .min(1),

  DATABASE_SSL: booleanFromEnv,

  DATABASE_POOL_MIN: positiveIntegerFromEnv
    .default(2),

  DATABASE_POOL_MAX: positiveIntegerFromEnv
    .default(20),

  DATABASE_IDLE_TIMEOUT_MS: positiveIntegerFromEnv
    .default(30000),

  DATABASE_CONNECTION_TIMEOUT_MS: positiveIntegerFromEnv
    .default(10000),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  JWT_EXPIRES_IN: z
    .string()
    .min(1)
    .default("15m"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .min(1)
    .default("7d"),

  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must contain at least 32 characters"),

  COOKIE_SECURE: booleanFromEnv,

  COOKIE_HTTP_ONLY: booleanFromEnv,

  COOKIE_SAME_SITE: z
    .enum(["strict", "lax", "none"])
    .default("lax"),

  CORS_ORIGIN: z
    .string()
    .min(1),

  LOG_LEVEL: z
    .enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent"
    ])
    .default("info"),

  LOG_FORMAT: z
    .enum(["pretty", "json"])
    .default("json"),

  MAX_UPLOAD_SIZE_MB: positiveIntegerFromEnv
    .default(20),

  ALLOWED_UPLOAD_EXTENSIONS: z
    .string()
    .default(".xlsx,.xls,.csv"),

  DEFAULT_PAGE_SIZE: positiveIntegerFromEnv
    .default(25),

  MAX_PAGE_SIZE: positiveIntegerFromEnv
    .default(100),

  AUDIT_LOG_RETENTION_DAYS: positiveIntegerFromEnv
    .default(365),

  WARRANTY_EXPIRY_WARNING_DAYS: positiveIntegerFromEnv
    .default(30),

  LICENSE_EXPIRY_WARNING_DAYS: positiveIntegerFromEnv
    .default(30),

  SMTP_HOST: z
    .string()
    .optional()
    .default(""),

  SMTP_PORT: positiveIntegerFromEnv
    .default(587),

  SMTP_SECURE: booleanFromEnv,

  SMTP_USER: z
    .string()
    .optional()
    .default(""),

  SMTP_PASSWORD: z
    .string()
    .optional()
    .default(""),

  SMTP_FROM_NAME: z
    .string()
    .default("Inventory Management"),

  SMTP_FROM_EMAIL: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .default("")
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Invalid environment configuration:");

  console.error(
    parsedEnvironment.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;

export type Environment = typeof env;