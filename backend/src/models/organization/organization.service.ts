import {
  AppError
} from "../../utils/errors.js";

import {
  createPaginationMeta,
  normalizePagination
} from "../../utils/pagination.js";

import {
  createCompany as createCompanyRepository,
  createDepartment as createDepartmentRepository,
  createLocation as createLocationRepository,
  deactivateCompany,
  deactivateDepartment,
  deactivateLocation,
  findCompanyById,
  findCompanyByName,
  findDepartmentById,
  findDepartmentByName,
  findLocationById,
  findLocationByName,
  listCompanies as listCompaniesRepository,
  listDepartments as listDepartmentsRepository,
  listLocations as listLocationsRepository,
  updateCompany as updateCompanyRepository,
  updateDepartment as updateDepartmentRepository,
  updateLocation as updateLocationRepository
} from "./organization.repository.js";

import type {
  CreateCompanyInput,
  CreateDepartmentInput,
  CreateLocationInput,
  OrganizationListQuery,
  UpdateCompanyInput,
  UpdateDepartmentInput,
  UpdateLocationInput
} from "./organization.schemas.js";


// ============================================================
// Company
// ============================================================

export async function getCompany(
  id: string
) {
  const company =
    await findCompanyById(id);

  if (!company) {
    throw new AppError(
      "Company not found.",
      404,
      "COMPANY_NOT_FOUND"
    );
  }

  return company;
}

export async function getCompanies(
  input: OrganizationListQuery
) {
  const pagination =
    normalizePagination(
      input.page,
      input.pageSize,
      100
    );

  const result =
    await listCompaniesRepository(
      pagination.page,
      pagination.pageSize,
      input.search,
      input.isActive
    );

  return {
    data: result.rows,
    pagination:
      createPaginationMeta(
        pagination.page,
        pagination.pageSize,
        result.total
      )
  };
}

export async function createNewCompany(
  input: CreateCompanyInput
) {
  const existing =
    await findCompanyByName(
      input.name
    );

  if (existing) {
    throw new AppError(
      "A company with this name already exists.",
      409,
      "COMPANY_ALREADY_EXISTS"
    );
  }

  return createCompanyRepository(input);
}

export async function updateExistingCompany(
  id: string,
  input: UpdateCompanyInput
) {
  await getCompany(id);

  if (input.name) {
    const existing =
      await findCompanyByName(
        input.name
      );

    if (
      existing &&
      existing.id !== id
    ) {
      throw new AppError(
        "A company with this name already exists.",
        409,
        "COMPANY_ALREADY_EXISTS"
      );
    }
  }

  const company =
    await updateCompanyRepository(
      id,
      input
    );

  if (!company) {
    throw new AppError(
      "Company not found.",
      404,
      "COMPANY_NOT_FOUND"
    );
  }

  return company;
}

export async function deactivateExistingCompany(
  id: string
) {
  await getCompany(id);

  await deactivateCompany(id);

  return {
    message:
      "Company deactivated successfully."
  };
}


// ============================================================
// Department
// ============================================================

export async function getDepartment(
  id: string
) {
  const department =
    await findDepartmentById(id);

  if (!department) {
    throw new AppError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

  return department;
}

export async function getDepartments(
  input: OrganizationListQuery
) {
  const pagination =
    normalizePagination(
      input.page,
      input.pageSize,
      100
    );

  const result =
    await listDepartmentsRepository(
      pagination.page,
      pagination.pageSize,
      input.search,
      input.companyId,
      input.isActive
    );

  return {
    data: result.rows,
    pagination:
      createPaginationMeta(
        pagination.page,
        pagination.pageSize,
        result.total
      )
  };
}

export async function createNewDepartment(
  input: CreateDepartmentInput
) {
  await getCompany(
    input.companyId
  );

  const existing =
    await findDepartmentByName(
      input.companyId,
      input.name
    );

  if (existing) {
    throw new AppError(
      "A department with this name already exists in this company.",
      409,
      "DEPARTMENT_ALREADY_EXISTS"
    );
  }

  return createDepartmentRepository(input);
}

export async function updateExistingDepartment(
  id: string,
  input: UpdateDepartmentInput
) {
  await getDepartment(id);

  if (input.name) {
    const current =
      await getDepartment(id);

    const existing =
      await findDepartmentByName(
        current.company_id,
        input.name
      );

    if (
      existing &&
      existing.id !== id
    ) {
      throw new AppError(
        "A department with this name already exists in this company.",
        409,
        "DEPARTMENT_ALREADY_EXISTS"
      );
    }
  }

  const department =
    await updateDepartmentRepository(
      id,
      input
    );

  if (!department) {
    throw new AppError(
      "Department not found.",
      404,
      "DEPARTMENT_NOT_FOUND"
    );
  }

  return department;
}

export async function deactivateExistingDepartment(
  id: string
) {
  await getDepartment(id);

  await deactivateDepartment(id);

  return {
    message:
      "Department deactivated successfully."
  };
}


// ============================================================
// Location
// ============================================================

export async function getLocation(
  id: string
) {
  const location =
    await findLocationById(id);

  if (!location) {
    throw new AppError(
      "Location not found.",
      404,
      "LOCATION_NOT_FOUND"
    );
  }

  return location;
}

export async function getLocations(
  input: OrganizationListQuery
) {
  const pagination =
    normalizePagination(
      input.page,
      input.pageSize,
      100
    );

  const result =
    await listLocationsRepository(
      pagination.page,
      pagination.pageSize,
      input.search,
      input.companyId,
      input.isActive
    );

  return {
    data: result.rows,
    pagination:
      createPaginationMeta(
        pagination.page,
        pagination.pageSize,
        result.total
      )
  };
}

export async function createNewLocation(
  input: CreateLocationInput
) {
  await getCompany(
    input.companyId
  );

  const existing =
    await findLocationByName(
      input.companyId,
      input.name
    );

  if (existing) {
    throw new AppError(
      "A location with this name already exists in this company.",
      409,
      "LOCATION_ALREADY_EXISTS"
    );
  }

  return createLocationRepository(input);
}

export async function updateExistingLocation(
  id: string,
  input: UpdateLocationInput
) {
  const current =
    await getLocation(id);

  if (input.name) {
    const existing =
      await findLocationByName(
        current.company_id,
        input.name
      );

    if (
      existing &&
      existing.id !== id
    ) {
      throw new AppError(
        "A location with this name already exists in this company.",
        409,
        "LOCATION_ALREADY_EXISTS"
      );
    }
  }

  const location =
    await updateLocationRepository(
      id,
      input
    );

  if (!location) {
    throw new AppError(
      "Location not found.",
      404,
      "LOCATION_NOT_FOUND"
    );
  }

  return location;
}

export async function deactivateExistingLocation(
  id: string
) {
  await getLocation(id);

  await deactivateLocation(id);

  return {
    message:
      "Location deactivated successfully."
  };
}

export const createCompany = createNewCompany;
export const updateCompany = updateExistingCompany;
export const deleteCompany = deactivateExistingCompany;
export const getCompanyById = getCompany;
export const listCompanies = getCompanies;

export const createDepartment = createNewDepartment;
export const updateDepartment = updateExistingDepartment;
export const deleteDepartment = deactivateExistingDepartment;
export const getDepartmentById = getDepartment;
export const listDepartments = getDepartments;

export const createLocation = createNewLocation;
export const updateLocation = updateExistingLocation;
export const deleteLocation = deactivateExistingLocation;
export const getLocationById = getLocation;
export const listLocations = getLocations;