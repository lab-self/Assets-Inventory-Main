// ============================================================
// Authentication Validation Schemas
// ============================================================

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email address is required")
    .max(320),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128)
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
});

export type LoginInput = z.infer<typeof loginSchema>;

export type RefreshTokenInput =
  z.infer<typeof refreshTokenSchema>;