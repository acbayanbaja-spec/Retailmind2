import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

type Env = z.infer<typeof envSchema>;
export const env: Env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

const PLACEHOLDER_SECRETS = new Set([
  "your-jwt-secret-min-32-characters-long",
  "your-jwt-refresh-secret-min-32-characters",
  "change-me-in-production-use-openssl-rand",
]);

if (isProduction) {
  const errors: string[] = [];

  if (PLACEHOLDER_SECRETS.has(env.JWT_SECRET) || PLACEHOLDER_SECRETS.has(env.JWT_REFRESH_SECRET)) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must not use placeholder values in production");
  }
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must be different in production");
  }
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN.trim() === "*") {
    errors.push("CORS_ORIGIN must list explicit allowed origins in production (comma-separated)");
  }

  if (errors.length > 0) {
    console.error("Production security configuration errors:");
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  }
}
