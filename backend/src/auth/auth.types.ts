// ============================================================
// Authentication Internal Types
// ============================================================

import type {
  AuthenticatedUser,
  AccessTokenPayload,
  RefreshTokenPayload
} from "../types/auth.js";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export type AuthenticatedRequestUser = AuthenticatedUser;

export type AccessJwtPayload = AccessTokenPayload;

export type RefreshJwtPayload = RefreshTokenPayload;