import {
  execute,
  findMany,
  findOne
} from "../../database/index.js";

import type {
  CreateCompanyInput,
  CreateDepartmentInput,
  CreateLocationInput,
  UpdateCompanyInput,
  UpdateDepartmentInput,
  UpdateLocationInput
} from "./organization.schemas.js";


// ============================================================
// Database Row Types
// ============================================================

export interface CompanyRow {
  id: string;

  name: string;
  legal_name: string | null;
  description: string | null;

  email: string | null;
  phone: string | null;
  website: string | null;

  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface DepartmentRow {
  id: string;

  company_id: string;

  name: string;
  description: string | null;

  manager_name: string | null;
  email: string | null;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface LocationRow {
  id: string;

  company_id: string;

  name: string;
  description: string | null;

  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  building: string | null;
  floor: string | null;
  room: string | null;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

interface CountRow {
  count: string;
}


// ============================================================
// Company
// ============================================================

export async function findCompanyById(
  id: string
): Promise<CompanyRow | null> {
  return findOne<CompanyRow>(
    `
      SELECT
        id,
        name,
        legal_name,
        description,
        email,
        phone,
        website,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        is_active,
        created_at,
        updated_at
      FROM companies
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
}

export async function findCompanyByName(
  name: string
): Promise<CompanyRow | null> {
  return findOne<CompanyRow>(
    `
      SELECT
        id,
        name,
        legal_name,
        description,
        email,
        phone,
        website,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        is_active,
        created_at,
        updated_at
      FROM companies
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
    `,
    [name]
  );
}

export async function listCompanies(
  page: number,
  pageSize: number,
  search?: string,
  isActive?: boolean
): Promise<{
  rows: CompanyRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        name ILIKE $${values.length}
        OR legal_name ILIKE $${values.length}
        OR city ILIKE $${values.length}
        OR state ILIKE $${values.length}
      )
    `);
  }

  if (isActive !== undefined) {
    values.push(isActive);

    conditions.push(
      `is_active = $${values.length}`
    );
  }

  const where =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const count =
    await findOne<CountRow>(
      `
        SELECT COUNT(*)::text AS count
        FROM companies
        ${where}
      `,
      values
    );

  const total = Number(
    count?.count ?? "0"
  );

  values.push(pageSize);
  const limitIndex = values.length;

  values.push(
    (page - 1) * pageSize
  );
  const offsetIndex = values.length;

  const rows =
    await findMany<CompanyRow>(
      `
        SELECT
          id,
          name,
          legal_name,
          description,
          email,
          phone,
          website,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_active,
          created_at,
          updated_at
        FROM companies
        ${where}
        ORDER BY name ASC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

  return {
    rows,
    total
  };
}

export async function createCompany(
  input: CreateCompanyInput
): Promise<CompanyRow> {
  const result =
    await execute<CompanyRow>(
      `
        INSERT INTO companies (
          name,
          legal_name,
          description,
          email,
          phone,
          website,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING
          id,
          name,
          legal_name,
          description,
          email,
          phone,
          website,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_active,
          created_at,
          updated_at
      `,
      [
        input.name,
        input.legalName ?? null,
        input.description ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.website ?? null,
        input.addressLine1 ?? null,
        input.addressLine2 ?? null,
        input.city ?? null,
        input.state ?? null,
        input.postalCode ?? null,
        input.country ?? null,
        input.isActive
      ]
    );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Company creation failed."
    );
  }

  return row;
}

export async function updateCompany(
  id: string,
  input: UpdateCompanyInput
): Promise<CompanyRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const add = (
    column: string,
    value: unknown
  ) => {
    values.push(value);
    fields.push(
      `${column} = $${values.length}`
    );
  };

  if (input.name !== undefined)
    add("name", input.name);

  if (input.legalName !== undefined)
    add("legal_name", input.legalName);

  if (input.description !== undefined)
    add(
      "description",
      input.description
    );

  if (input.email !== undefined)
    add("email", input.email);

  if (input.phone !== undefined)
    add("phone", input.phone);

  if (input.website !== undefined)
    add("website", input.website);

  if (input.addressLine1 !== undefined)
    add(
      "address_line_1",
      input.addressLine1
    );

  if (input.addressLine2 !== undefined)
    add(
      "address_line_2",
      input.addressLine2
    );

  if (input.city !== undefined)
    add("city", input.city);

  if (input.state !== undefined)
    add("state", input.state);

  if (input.postalCode !== undefined)
    add(
      "postal_code",
      input.postalCode
    );

  if (input.country !== undefined)
    add("country", input.country);

  if (input.isActive !== undefined)
    add(
      "is_active",
      input.isActive
    );

  if (fields.length === 0) {
    return findCompanyById(id);
  }

  values.push(id);

  const result =
    await execute<CompanyRow>(
      `
        UPDATE companies
        SET
          ${fields.join(", ")}
        WHERE id = $${values.length}
        RETURNING
          id,
          name,
          legal_name,
          description,
          email,
          phone,
          website,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_active,
          created_at,
          updated_at
      `,
      values
    );

  return result.rows[0] ?? null;
}

export async function deactivateCompany(
  id: string
): Promise<boolean> {
  const result =
    await execute(
      `
        UPDATE companies
        SET is_active = FALSE
        WHERE id = $1
      `,
      [id]
    );

  return (result.rowCount ?? 0) > 0;
}


// ============================================================
// Department
// ============================================================

export async function findDepartmentById(
  id: string
): Promise<DepartmentRow | null> {
  return findOne<DepartmentRow>(
    `
      SELECT
        id,
        company_id,
        name,
        description,
        manager_name,
        email,
        is_active,
        created_at,
        updated_at
      FROM departments
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
}

export async function findDepartmentByName(
  companyId: string,
  name: string
): Promise<DepartmentRow | null> {
  return findOne<DepartmentRow>(
    `
      SELECT
        id,
        company_id,
        name,
        description,
        manager_name,
        email,
        is_active,
        created_at,
        updated_at
      FROM departments
      WHERE company_id = $1
        AND LOWER(name) = LOWER($2)
      LIMIT 1
    `,
    [companyId, name]
  );
}

export async function listDepartments(
  page: number,
  pageSize: number,
  search?: string,
  companyId?: string,
  isActive?: boolean
): Promise<{
  rows: DepartmentRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        d.name ILIKE $${values.length}
        OR d.manager_name ILIKE $${values.length}
        OR d.email ILIKE $${values.length}
      )
    `);
  }

  if (companyId) {
    values.push(companyId);

    conditions.push(
      `d.company_id = $${values.length}`
    );
  }

  if (isActive !== undefined) {
    values.push(isActive);

    conditions.push(
      `d.is_active = $${values.length}`
    );
  }

  const where =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const count =
    await findOne<CountRow>(
      `
        SELECT COUNT(*)::text AS count
        FROM departments d
        ${where}
      `,
      values
    );

  const total = Number(
    count?.count ?? "0"
  );

  values.push(pageSize);
  const limitIndex = values.length;

  values.push(
    (page - 1) * pageSize
  );
  const offsetIndex = values.length;

  const rows =
    await findMany<DepartmentRow>(
      `
        SELECT
          d.id,
          d.company_id,
          d.name,
          d.description,
          d.manager_name,
          d.email,
          d.is_active,
          d.created_at,
          d.updated_at
        FROM departments d
        ${where}
        ORDER BY d.name ASC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

  return {
    rows,
    total
  };
}

export async function createDepartment(
  input: CreateDepartmentInput
): Promise<DepartmentRow> {
  const result =
    await execute<DepartmentRow>(
      `
        INSERT INTO departments (
          company_id,
          name,
          description,
          manager_name,
          email,
          is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6
        )
        RETURNING
          id,
          company_id,
          name,
          description,
          manager_name,
          email,
          is_active,
          created_at,
          updated_at
      `,
      [
        input.companyId,
        input.name,
        input.description ?? null,
        input.managerName ?? null,
        input.email ?? null,
        input.isActive
      ]
    );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Department creation failed."
    );
  }

  return row;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput
): Promise<DepartmentRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const add = (
    column: string,
    value: unknown
  ) => {
    values.push(value);
    fields.push(
      `${column} = $${values.length}`
    );
  };

  if (input.name !== undefined)
    add("name", input.name);

  if (
    input.description !== undefined
  )
    add(
      "description",
      input.description
    );

  if (
    input.managerName !== undefined
  )
    add(
      "manager_name",
      input.managerName
    );

  if (input.email !== undefined)
    add("email", input.email);

  if (input.isActive !== undefined)
    add(
      "is_active",
      input.isActive
    );

  if (fields.length === 0) {
    return findDepartmentById(id);
  }

  values.push(id);

  const result =
    await execute<DepartmentRow>(
      `
        UPDATE departments
        SET
          ${fields.join(", ")}
        WHERE id = $${values.length}
        RETURNING
          id,
          company_id,
          name,
          description,
          manager_name,
          email,
          is_active,
          created_at,
          updated_at
      `,
      values
    );

  return result.rows[0] ?? null;
}

export async function deactivateDepartment(
  id: string
): Promise<boolean> {
  const result =
    await execute(
      `
        UPDATE departments
        SET is_active = FALSE
        WHERE id = $1
      `,
      [id]
    );

  return (result.rowCount ?? 0) > 0;
}


// ============================================================
// Location
// ============================================================

export async function findLocationById(
  id: string
): Promise<LocationRow | null> {
  return findOne<LocationRow>(
    `
      SELECT
        id,
        company_id,
        name,
        description,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        building,
        floor,
        room,
        is_active,
        created_at,
        updated_at
      FROM locations
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
}

export async function findLocationByName(
  companyId: string,
  name: string
): Promise<LocationRow | null> {
  return findOne<LocationRow>(
    `
      SELECT
        id,
        company_id,
        name,
        description,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        building,
        floor,
        room,
        is_active,
        created_at,
        updated_at
      FROM locations
      WHERE company_id = $1
        AND LOWER(name) = LOWER($2)
      LIMIT 1
    `,
    [companyId, name]
  );
}

export async function listLocations(
  page: number,
  pageSize: number,
  search?: string,
  companyId?: string,
  isActive?: boolean
): Promise<{
  rows: LocationRow[];
  total: number;
}> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        l.name ILIKE $${values.length}
        OR l.city ILIKE $${values.length}
        OR l.state ILIKE $${values.length}
        OR l.building ILIKE $${values.length}
        OR l.room ILIKE $${values.length}
      )
    `);
  }

  if (companyId) {
    values.push(companyId);

    conditions.push(
      `l.company_id = $${values.length}`
    );
  }

  if (isActive !== undefined) {
    values.push(isActive);

    conditions.push(
      `l.is_active = $${values.length}`
    );
  }

  const where =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const count =
    await findOne<CountRow>(
      `
        SELECT COUNT(*)::text AS count
        FROM locations l
        ${where}
      `,
      values
    );

  const total = Number(
    count?.count ?? "0"
  );

  values.push(pageSize);
  const limitIndex = values.length;

  values.push(
    (page - 1) * pageSize
  );
  const offsetIndex = values.length;

  const rows =
    await findMany<LocationRow>(
      `
        SELECT
          l.id,
          l.company_id,
          l.name,
          l.description,
          l.address_line_1,
          l.address_line_2,
          l.city,
          l.state,
          l.postal_code,
          l.country,
          l.building,
          l.floor,
          l.room,
          l.is_active,
          l.created_at,
          l.updated_at
        FROM locations l
        ${where}
        ORDER BY l.name ASC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

  return {
    rows,
    total
  };
}

export async function createLocation(
  input: CreateLocationInput
): Promise<LocationRow> {
  const result =
    await execute<LocationRow>(
      `
        INSERT INTO locations (
          company_id,
          name,
          description,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          building,
          floor,
          room,
          is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING
          id,
          company_id,
          name,
          description,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          building,
          floor,
          room,
          is_active,
          created_at,
          updated_at
      `,
      [
        input.companyId,
        input.name,
        input.description ?? null,
        input.addressLine1 ?? null,
        input.addressLine2 ?? null,
        input.city ?? null,
        input.state ?? null,
        input.postalCode ?? null,
        input.country ?? null,
        input.building ?? null,
        input.floor ?? null,
        input.room ?? null,
        input.isActive
      ]
    );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Location creation failed."
    );
  }

  return row;
}

export async function updateLocation(
  id: string,
  input: UpdateLocationInput
): Promise<LocationRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const add = (
    column: string,
    value: unknown
  ) => {
    values.push(value);
    fields.push(
      `${column} = $${values.length}`
    );
  };

  if (input.name !== undefined)
    add("name", input.name);

  if (
    input.description !== undefined
  )
    add(
      "description",
      input.description
    );

  if (
    input.addressLine1 !== undefined
  )
    add(
      "address_line_1",
      input.addressLine1
    );

  if (
    input.addressLine2 !== undefined
  )
    add(
      "address_line_2",
      input.addressLine2
    );

  if (input.city !== undefined)
    add("city", input.city);

  if (input.state !== undefined)
    add("state", input.state);

  if (
    input.postalCode !== undefined
  )
    add(
      "postal_code",
      input.postalCode
    );

  if (input.country !== undefined)
    add(
      "country",
      input.country
    );

  if (input.building !== undefined)
    add(
      "building",
      input.building
    );

  if (input.floor !== undefined)
    add("floor", input.floor);

  if (input.room !== undefined)
    add("room", input.room);

  if (input.isActive !== undefined)
    add(
      "is_active",
      input.isActive
    );

  if (fields.length === 0) {
    return findLocationById(id);
  }

  values.push(id);

  const result =
    await execute<LocationRow>(
      `
        UPDATE locations
        SET
          ${fields.join(", ")}
        WHERE id = $${values.length}
        RETURNING
          id,
          company_id,
          name,
          description,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          building,
          floor,
          room,
          is_active,
          created_at,
          updated_at
      `,
      values
    );

  return result.rows[0] ?? null;
}

export async function deactivateLocation(
  id: string
): Promise<boolean> {
  const result =
    await execute(
      `
        UPDATE locations
        SET is_active = FALSE
        WHERE id = $1
      `,
      [id]
    );

  return (result.rowCount ?? 0) > 0;
}