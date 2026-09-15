// ============================================================
// Authentication & Authorization Types
// ============================================================

import type { UUID, UserStatus } from "./common.js";

export interface AuthenticatedUser {
  id: UUID;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  companyId: UUID | null;
  departmentId: UUID | null;
  locationId: UUID | null;
  status: UserStatus;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

export interface AccessTokenPayload {
  sub: UUID;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: UUID;
  type: "refresh";
  tokenVersion: number;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: AuthenticatedUser;
}

export interface SessionContext {
  user: AuthenticatedUser;
  ipAddress?: string;
  userAgent?: string;
}