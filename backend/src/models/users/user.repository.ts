import {
  execute,
  findMany,
  findOne,
  withTransaction
} from "../../database/index.js";

import type { PoolClient } from "pg";

import type {
  CreateUserInput,
  UpdateUserInput
} from "./user.schemas.js";

interface UserRow {
  id: string;

  company_id: string | null;
  department_id: string | null;
  location_id: string | null;

  employee_id: string | null;

  first_name: string;
  last_name: string;

  email: string;

  phone: string | null;

  job_title: string | null;

  status:
    | "active"
    | "inactive"
    | "suspended"
    | "locked";

  is_super_admin: boolean;

  last_login_at: Date | null;
  password_changed_at: Date | null;

  failed_login_attempts: number;
  locked_until: Date | null;

  created_at: Date;
  updated_at: Date;
}

interface RoleRow {
  role_id: string;
  role_code: string;
}

interface UserCountRow {
  count: string;
}

export async function findUserById(
  id: string
): Promise<UserRow | null> {
  return findOne<UserRow>(
    `
      SELECT
        id,
        company_id,
        department_id,
        location_id,
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        status,
        is_super_admin,
        last_login_at,
        password_changed_at,
        failed_login_attempts,
        locked_until,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
}

export async function findUserByEmail(
  email: string
): Promise<UserRow | null> {
  return findOne<UserRow>(
    `
      SELECT
        id,
        company_id,
        department_id,
        location_id,
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
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
    [email]
  );
}

export async function findUsers(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    companyId?: string;
    departmentId?: string;
    locationId?: string;
  }
): Promise<{
  rows: UserRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addValue = (
    value: unknown
  ): number => {
    values.push(value);
    return values.length;
  };

  if (filters.search) {
    const parameter = addValue(
      `%${filters.search}%`
    );

    conditions.push(`
      (
        first_name ILIKE $${parameter}
        OR last_name ILIKE $${parameter}
        OR email ILIKE $${parameter}
        OR employee_id ILIKE $${parameter}
      )
    `);
  }

  if (filters.status) {
    const parameter = addValue(
      filters.status
    );

    conditions.push(
      `status = $${parameter}`
    );
  }

  if (filters.companyId) {
    const parameter = addValue(
      filters.companyId
    );

    conditions.push(
      `company_id = $${parameter}`
    );
  }

  if (filters.departmentId) {
    const parameter = addValue(
      filters.departmentId
    );

    conditions.push(
      `department_id = $${parameter}`
    );
  }

  if (filters.locationId) {
    const parameter = addValue(
      filters.locationId
    );

    conditions.push(
      `location_id = $${parameter}`
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const countResult =
    await findOne<UserCountRow>(
      `
        SELECT COUNT(*)::text AS count
        FROM users
        ${whereClause}
      `,
      values
    );

  const total = Number(
    countResult?.count ?? "0"
  );

  const limitParameter = addValue(
    filters.pageSize
  );

  const offsetParameter = addValue(
    (filters.page - 1) *
      filters.pageSize
  );

  const rows =
    await findMany<UserRow>(
      `
        SELECT
          id,
          company_id,
          department_id,
          location_id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          status,
          is_super_admin,
          last_login_at,
          password_changed_at,
          failed_login_attempts,
          locked_until,
          created_at,
          updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParameter}
        OFFSET $${offsetParameter}
      `,
      values
    );

  return {
    rows,
    total
  };
}

export async function createUser(
  input: CreateUserInput,
  passwordHash: string
): Promise<UserRow> {
  return withTransaction(
    async (client) => {
      const result =
        await client.query<UserRow>(
          `
            INSERT INTO users (
              company_id,
              department_id,
              location_id,
              employee_id,
              first_name,
              last_name,
              email,
              phone,
              password_hash,
              job_title,
              status,
              is_super_admin,
              password_changed_at
            )
            VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $12, NOW()
            )
            RETURNING
              id,
              company_id,
              department_id,
              location_id,
              employee_id,
              first_name,
              last_name,
              email,
              phone,
              job_title,
              status,
              is_super_admin,
              last_login_at,
              password_changed_at,
              failed_login_attempts,
              locked_until,
              created_at,
              updated_at
          `,
          [
            input.companyId ?? null,
            input.departmentId ?? null,
            input.locationId ?? null,
            input.employeeId ?? null,
            input.firstName,
            input.lastName ?? null,
            input.email,
            input.phone ?? null,
            passwordHash,
            input.jobTitle ?? null,
            input.status,
            input.isSuperAdmin
          ]
        );

      const user =
        result.rows[0];

      if (!user) {
        throw new Error(
          "User creation failed."
        );
      }

      if (input.roleIds.length > 0) {
        await assignRoles(
          client,
          user.id,
          input.roleIds
        );
      }

      return user;
    }
  );
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<UserRow | null> {
  return withTransaction(
    async (client) => {
      const fields: string[] = [];
      const values: unknown[] = [];

      const addField = (
        column: string,
        value: unknown
      ) => {
        values.push(value);

        fields.push(
          `${column} = $${values.length}`
        );
      };

      if (
        input.companyId !== undefined
      ) {
        addField(
          "company_id",
          input.companyId
        );
      }

      if (
        input.departmentId !== undefined
      ) {
        addField(
          "department_id",
          input.departmentId
        );
      }

      if (
        input.locationId !== undefined
      ) {
        addField(
          "location_id",
          input.locationId
        );
      }

      if (
        input.employeeId !== undefined
      ) {
        addField(
          "employee_id",
          input.employeeId
        );
      }

      if (
        input.firstName !== undefined
      ) {
        addField(
          "first_name",
          input.firstName
        );
      }

      if (
        input.lastName !== undefined
      ) {
        addField(
          "last_name",
          input.lastName
        );
      }

      if (input.email !== undefined) {
        addField(
          "email",
          input.email
        );
      }

      if (input.phone !== undefined) {
        addField(
          "phone",
          input.phone
        );
      }

      if (
        input.jobTitle !== undefined
      ) {
        addField(
          "job_title",
          input.jobTitle
        );
      }

      if (input.status !== undefined) {
        addField(
          "status",
          input.status
        );
      }

      if (
        input.isSuperAdmin !== undefined
      ) {
        addField(
          "is_super_admin",
          input.isSuperAdmin
        );
      }

      let user: UserRow | null;

      if (fields.length > 0) {
        values.push(id);

        const result =
          await client.query<UserRow>(
            `
              UPDATE users
              SET
                ${fields.join(", ")}
              WHERE id = $${values.length}
              RETURNING
                id,
                company_id,
                department_id,
                location_id,
                employee_id,
                first_name,
                last_name,
                email,
                phone,
                job_title,
                status,
                is_super_admin,
                last_login_at,
                password_changed_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            `,
            values
          );

        user =
          result.rows[0] ?? null;
      } else {
        user =
          await findUserByIdWithClient(
            client,
            id
          );
      }

      if (!user) {
        return null;
      }

      if (
        input.roleIds !== undefined
      ) {
        await client.query(
          `
            DELETE FROM user_roles
            WHERE user_id = $1
          `,
          [id]
        );

        if (input.roleIds.length > 0) {
          await assignRoles(
            client,
            id,
            input.roleIds
          );
        }
      }

      return user;
    }
  );
}

export async function updateUserPassword(
  id: string,
  passwordHash: string
): Promise<boolean> {
  const result =
    await execute(
      `
        UPDATE users
        SET
          password_hash = $2,
          password_changed_at = NOW(),
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE id = $1
      `,
      [id, passwordHash]
    );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteUser(
  id: string
): Promise<boolean> {
  const result =
    await execute(
      `
        UPDATE users
        SET
          status = 'inactive'
        WHERE id = $1
      `,
      [id]
    );

  return (result.rowCount ?? 0) > 0;
}

export async function findUserRoles(
  userId: string
): Promise<RoleRow[]> {
  return findMany<RoleRow>(
    `
      SELECT
        r.id AS role_id,
        r.code AS role_code
      FROM user_roles ur
      INNER JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.is_active = TRUE
      ORDER BY r.code
    `,
    [userId]
  );
}

async function findUserByIdWithClient(
  client: PoolClient,
  id: string
): Promise<UserRow | null> {
  const result =
    await client.query<UserRow>(
      `
        SELECT
          id,
          company_id,
          department_id,
          location_id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          status,
          is_super_admin,
          last_login_at,
          password_changed_at,
          failed_login_attempts,
          locked_until,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

  return result.rows[0] ?? null;
}

async function assignRoles(
  client: PoolClient,
  userId: string,
  roleIds: string[]
): Promise<void> {
  await client.query(
    `
      INSERT INTO user_roles (
        user_id,
        role_id
      )
      SELECT
        $1,
        id
      FROM roles
      WHERE id = ANY($2::uuid[])
        AND is_active = TRUE
      ON CONFLICT DO NOTHING
    `,
    [userId, roleIds]
  );
}