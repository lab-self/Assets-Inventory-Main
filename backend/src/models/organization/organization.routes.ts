import type { FastifyInstance } from "fastify";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/authorize.js";

import {
  createCompanySchema,
  updateCompanySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createLocationSchema,
  updateLocationSchema,
} from "./organization.schemas.js";

import {
  createNewCompany,
  createNewDepartment,
  createNewLocation,
  getCompany,
  getCompanies,
  getDepartment,
  getDepartments,
  getLocation,
  getLocations,
  updateCompany,
  updateDepartment,
  updateLocation,
  deleteCompany,
  deleteDepartment,
  deleteLocation,
} from "./organization.service.js";

const protectedOrganization = [authenticate];

export async function organizationRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/companies",
    { preHandler: [...protectedOrganization, requirePermission("companies.read")] },
    async (request) => getCompanies({ page: 1, pageSize: 25, ...(request.query as Record<string, unknown>) }),
  );

  app.get(
    "/companies/:id",
    { preHandler: [...protectedOrganization, requirePermission("companies.read")] },
    async (request) => getCompany((request.params as { id: string }).id),
  );

  app.post(
    "/companies",
    { preHandler: [...protectedOrganization, requirePermission("companies.create")] },
    async (request, reply) => reply.code(201).send(await createNewCompany(createCompanySchema.parse(request.body))),
  );

  app.patch(
    "/companies/:id",
    { preHandler: [...protectedOrganization, requirePermission("companies.update")] },
    async (request) => updateCompany((request.params as { id: string }).id, updateCompanySchema.parse(request.body)),
  );

  app.delete(
    "/companies/:id",
    { preHandler: [...protectedOrganization, requirePermission("companies.delete")] },
    async (request) => deleteCompany((request.params as { id: string }).id),
  );

  app.get(
    "/departments",
    { preHandler: [...protectedOrganization, requirePermission("departments.read")] },
    async (request) => getDepartments({ page: 1, pageSize: 25, ...(request.query as Record<string, unknown>) }),
  );

  app.get(
    "/departments/:id",
    { preHandler: [...protectedOrganization, requirePermission("departments.read")] },
    async (request) => getDepartment((request.params as { id: string }).id),
  );

  app.post(
    "/departments",
    { preHandler: [...protectedOrganization, requirePermission("departments.create")] },
    async (request, reply) => reply.code(201).send(await createNewDepartment(createDepartmentSchema.parse(request.body))),
  );

  app.patch(
    "/departments/:id",
    { preHandler: [...protectedOrganization, requirePermission("departments.update")] },
    async (request) => updateDepartment((request.params as { id: string }).id, updateDepartmentSchema.parse(request.body)),
  );

  app.delete(
    "/departments/:id",
    { preHandler: [...protectedOrganization, requirePermission("departments.delete")] },
    async (request) => deleteDepartment((request.params as { id: string }).id),
  );

  app.get(
    "/locations",
    { preHandler: [...protectedOrganization, requirePermission("locations.read")] },
    async (request) => getLocations({ page: 1, pageSize: 25, ...(request.query as Record<string, unknown>) }),
  );

  app.get(
    "/locations/:id",
    { preHandler: [...protectedOrganization, requirePermission("locations.read")] },
    async (request) => getLocation((request.params as { id: string }).id),
  );

  app.post(
    "/locations",
    { preHandler: [...protectedOrganization, requirePermission("locations.create")] },
    async (request, reply) => reply.code(201).send(await createNewLocation(createLocationSchema.parse(request.body))),
  );

  app.patch(
    "/locations/:id",
    { preHandler: [...protectedOrganization, requirePermission("locations.update")] },
    async (request) => updateLocation((request.params as { id: string }).id, updateLocationSchema.parse(request.body)),
  );

  app.delete(
    "/locations/:id",
    { preHandler: [...protectedOrganization, requirePermission("locations.delete")] },
    async (request) => deleteLocation((request.params as { id: string }).id),
  );
}
