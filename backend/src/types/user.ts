// ============================================================
// User Domain Types
// ============================================================

import type { UUID, UserStatus } from "./common.js";

export interface User {
  id: UUID;

  companyId: UUID | null;
  departmentId: UUID | null;
  locationId: UUID | null;

  employeeId: string | null;

  firstName: string;
  lastName: string;

  email: string;

  phone: string | null;

  jobTitle: string | null;

  status: UserStatus;

  isSuperAdmin: boolean;

  lastLoginAt: string | null;
  passwordChangedAt: string | null;

  failedLoginAttempts: number;
  lockedUntil: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles extends User {
  roles: string[];
  permissions: string[];
}