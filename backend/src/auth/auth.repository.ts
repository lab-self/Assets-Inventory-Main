// ============================================================
// Authentication Repository
// ============================================================

import {
  findMany,
  findOne,
  query,
} from "../database/index.js";

import type { UserStatus } from "../types/common.js";
import type { UserWithRoles } from "../types/user.js";

interface UserAuthRow {
  id: string;
  employee_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  company_id: string | null;
  department_id: string | null;
  location_id: string | null;
  phone: string | null;
  job_title: string | null;
  password_hash: string;
  status: UserStatus;
  is_super_admin: boolean;
  last_login_at: Date | null;
  password_changed_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface RolePermissionRow {
  role_code: string;
  permission_code: string | null;
}

export interface UserAuthenticationRecord extends UserAuthRow {
  roles: string[];
  permissions: string[];
}

export async function findUserForAuthentication(
  email: string,
): Promise<UserAuthenticationRecord | null> {
  const user = await findOne<UserAuthRow>(
    `
      SELECT
        id,
        employee_id,
        email,
        first_name,
        last_name,
        company_id,
        department_id,
        location_id,
        phone,
        job_title,
        password_hash,
        status,
        is_super_admin,
        last_login_at,
        password_changed_at,
        failed_login_attempts,
        locked_until,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (!user) return null;

  const rolePermissions = await findMany<RolePermissionRow>(
    `
      SELECT
        r.code AS role_code,
        p.code AS permission_code
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p
        ON p.id = rp.permission_id
       AND p.is_active = TRUE
      WHERE ur.user_id = $1
        AND r.is_active = TRUE
      ORDER BY r.code, p.code
    `,
    [user.id],
  );

  return {
    ...user,
    roles: [...new Set(rolePermissions.map((item) => item.role_code))],
    permissions: [
      ...new Set(
        rolePermissions
          .map((item) => item.permission_code)
          .filter((permission): permission is string => Boolean(permission)),
      ),
    ],
  };
}

export async function updateSuccessfulLogin(userId: string): Promise<void> {
  await findOne(
    `
      UPDATE users
      SET
        last_login_at = NOW(),
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE id = $1
      RETURNING id
    `,
    [userId],
  );
}

export async function updateFailedLogin(
  userId: string,
  failedAttempts: number,
  lockUntil: Date | null,
): Promise<void> {
  await findOne(
    `
      UPDATE users
      SET
        failed_login_attempts = $2,
        locked_until = $3
      WHERE id = $1
      RETURNING id
    `,
    [userId, failedAttempts, lockUntil],
  );
}

export function toAuthenticatedUser(
  user: UserAuthenticationRecord,
): UserWithRoles {
  return {
    id: user.id,
    companyId: user.company_id,
    departmentId: user.department_id,
    locationId: user.location_id,
    employeeId: user.employee_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    jobTitle: user.job_title,
    status: user.status,
    isSuperAdmin: user.is_super_admin,
    lastLoginAt: user.last_login_at?.toISOString() ?? null,
    passwordChangedAt: user.password_changed_at?.toISOString() ?? null,
    failedLoginAttempts: user.failed_login_attempts,
    lockedUntil: user.locked_until?.toISOString() ?? null,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
    roles: user.roles,
    permissions: user.permissions,
  };
}

export async function findUserForAuthenticationById(
  userId: string,
): Promise<UserAuthenticationRecord | null> {
  const result = await query<UserAuthRow>(
    `
      SELECT
        u.id,
        u.employee_id,
        u.email,
        u.first_name,
        u.last_name,
        u.company_id,
        u.department_id,
        u.location_id,
        u.phone,
        u.job_title,
        u.password_hash,
        u.status,
        u.is_super_admin,
        u.last_login_at,
        u.password_changed_at,
        u.failed_login_attempts,
        u.locked_until,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
  );

  const user = result.rows[0];
  if (!user) return null;

  const rolesResult = await query<{ role_code: string }>(
    `
      SELECT r.code AS role_code
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.is_active = TRUE
      ORDER BY r.code
    `,
    [user.id],
  );

  const permissionsResult = await query<{ permission_code: string }>(
    `
      SELECT DISTINCT p.code AS permission_code
      FROM user_roles ur
      INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
      INNER JOIN permissions p ON p.id = rp.permission_id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.is_active = TRUE
        AND p.is_active = TRUE
      ORDER BY p.code
    `,
    [user.id],
  );

  return {
    ...user,
    roles: rolesResult.rows.map((row) => row.role_code),
    permissions: permissionsResult.rows.map((row) => row.permission_code),
  };
}
