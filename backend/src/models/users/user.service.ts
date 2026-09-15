import {
  AppError
} from "../../utils/errors.js";

import {
  hashPassword
} from "../../utils/password.js";

import {
  createPaginationMeta,
  normalizePagination
} from "../../utils/pagination.js";

import {
  normalizeEmail
} from "../../utils/strings.js";

import type {
  User,
  UserWithRoles
} from "../../types/user.js";

import {
  createUser as createUserRecord,
  deleteUser as deleteUserRecord,
  findUserByEmail,
  findUserById,
  findUserRoles,
  findUsers,
  updateUser as updateUserRecord,
  updateUserPassword
} from "./user.repository.js";

import type {
  CreateUserInput,
  UpdatePasswordInput,
  UpdateUserInput,
  UserListQuery
} from "./user.schemas.js";

function mapUser(
  row: Awaited<
    ReturnType<typeof findUserById>
  >
): User | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,

    companyId: row.company_id,
    departmentId: row.department_id,
    locationId: row.location_id,

    employeeId: row.employee_id,

    firstName: row.first_name,
    lastName: row.last_name,

    email: row.email,
    phone: row.phone,

    jobTitle: row.job_title,

    status: row.status,

    isSuperAdmin:
      row.is_super_admin,

    lastLoginAt:
      row.last_login_at
        ?.toISOString() ?? null,

    passwordChangedAt:
      row.password_changed_at
        ?.toISOString() ?? null,

    failedLoginAttempts:
      row.failed_login_attempts,

    lockedUntil:
      row.locked_until
        ?.toISOString() ?? null,

    createdAt:
      row.created_at.toISOString(),

    updatedAt:
      row.updated_at.toISOString()
  };
}

export async function getUserById(
  id: string
): Promise<UserWithRoles> {
  const row =
    await findUserById(id);

  if (!row) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const user =
    mapUser(row);

  if (!user) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const roles =
    await findUserRoles(id);

  return {
    ...user,
    roles: roles.map(
      (role) => role.role_code
    ),
    permissions: []
  };
}

export async function listUsers(
  input: UserListQuery
) {
  const pagination =
    normalizePagination(
      input.page,
      input.pageSize,
      100
    );

  const result =
    await findUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: input.search,
      status: input.status,
      companyId: input.companyId,
      departmentId: input.departmentId,
      locationId: input.locationId
    });

  return {
    data: result.rows
      .map((row) => mapUser(row))
      .filter(
        (user): user is User =>
          user !== null
      ),

    pagination:
      createPaginationMeta(
        pagination.page,
        pagination.pageSize,
        result.total
      )
  };
}

export async function createNewUser(
  input: CreateUserInput
): Promise<UserWithRoles> {
  const email =
    normalizeEmail(input.email);

  const existing =
    await findUserByEmail(email);

  if (existing) {
    throw new AppError(
      "A user with this email already exists.",
      409,
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const passwordHash =
    await hashPassword(
      input.password
    );

  const row =
    await createUserRecord(
      {
        ...input,
        email
      },
      passwordHash
    );

  const user =
    mapUser(row);

  if (!user) {
    throw new AppError(
      "User creation failed.",
      500,
      "USER_CREATE_FAILED"
    );
  }

  const roles =
    await findUserRoles(
      user.id
    );

  return {
    ...user,
    roles: roles.map(
      (role) => role.role_code
    ),
    permissions: []
  };
}

export async function updateExistingUser(
  id: string,
  input: UpdateUserInput
): Promise<UserWithRoles> {
  if (input.email) {
    const email =
      normalizeEmail(input.email);

    const existing =
      await findUserByEmail(email);

    if (
      existing &&
      existing.id !== id
    ) {
      throw new AppError(
        "A user with this email already exists.",
        409,
        "EMAIL_ALREADY_EXISTS"
      );
    }

    input = {
      ...input,
      email
    };
  }

  const row =
    await updateUserRecord(
      id,
      input
    );

  if (!row) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return getUserById(id);
}

export async function changeUserPassword(
  id: string,
  input: UpdatePasswordInput
): Promise<void> {
  const exists =
    await findUserById(id);

  if (!exists) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const passwordHash =
    await hashPassword(
      input.password
    );

  const updated =
    await updateUserPassword(
      id,
      passwordHash
    );

  if (!updated) {
    throw new AppError(
      "Password update failed.",
      500,
      "PASSWORD_UPDATE_FAILED"
    );
  }
}

export async function deactivateUser(
  id: string
): Promise<void> {
  const exists =
    await findUserById(id);

  if (!exists) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  await deleteUserRecord(id);
}

export const getUser = getUserById;
export const getUsers = listUsers;
export const createUser = createNewUser;
export const updateUser = updateExistingUser;
export const deleteUser = deactivateUser;