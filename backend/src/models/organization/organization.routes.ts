import type { FastifyInstance } from "fastify";

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

export async function organizationRoutes(
  app: FastifyInstance,
): Promise<void> {
  /*
   * ============================================================
   * COMPANIES
   * ============================================================
   */

  app.get(
    "/companies",
    {
      preHandler: [requirePermission("companies.read")],
    },
    async () => {
      return getCompanies({
        page: 1,
        pageSize: 25,
      });
    },
  );

  app.get(
    "/companies/:id",
    {
      preHandler: [requirePermission("companies.read")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return getCompany(params.id);
    },
  );

  app.post(
    "/companies",
    {
      preHandler: [requirePermission("companies.create")],
    },
    async (request, reply) => {
      const input = createCompanySchema.parse(request.body);

      const company = await createNewCompany(input);

      return reply.code(201).send(company);
    },
  );

  app.patch(
    "/companies/:id",
    {
      preHandler: [requirePermission("companies.update")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      const input = updateCompanySchema.parse(request.body);

      return updateCompany(params.id, input);
    },
  );

  app.delete(
    "/companies/:id",
    {
      preHandler: [requirePermission("companies.delete")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return deleteCompany(params.id);
    },
  );

  /*
   * ============================================================
   * DEPARTMENTS
   * ============================================================
   */

  app.get(
    "/departments",
    {
      preHandler: [requirePermission("departments.read")],
    },
    async () => {
      return getDepartments({
        page: 1,
        pageSize: 25,
      });
    },
  );

  app.get(
    "/departments/:id",
    {
      preHandler: [requirePermission("departments.read")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return getDepartment(params.id);
    },
  );

  app.post(
    "/departments",
    {
      preHandler: [requirePermission("departments.create")],
    },
    async (request, reply) => {
      const input = createDepartmentSchema.parse(request.body);

      const department = await createNewDepartment(input);

      return reply.code(201).send(department);
    },
  );

  app.patch(
    "/departments/:id",
    {
      preHandler: [requirePermission("departments.update")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      const input = updateDepartmentSchema.parse(request.body);

      return updateDepartment(params.id, input);
    },
  );

  app.delete(
    "/departments/:id",
    {
      preHandler: [requirePermission("departments.delete")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return deleteDepartment(params.id);
    },
  );

  /*
   * ============================================================
   * LOCATIONS
   * ============================================================
   */

  app.get(
    "/locations",
    {
      preHandler: [requirePermission("locations.read")],
    },
    async () => {
      return getLocations({
        page: 1,
        pageSize: 25,
      });
    },
  );

  app.get(
    "/locations/:id",
    {
      preHandler: [requirePermission("locations.read")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return getLocation(params.id);
    },
  );

  app.post(
    "/locations",
    {
      preHandler: [requirePermission("locations.create")],
    },
    async (request, reply) => {
      const input = createLocationSchema.parse(request.body);

      const location = await createNewLocation(input);

      return reply.code(201).send(location);
    },
  );

  app.patch(
    "/locations/:id",
    {
      preHandler: [requirePermission("locations.update")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      const input = updateLocationSchema.parse(request.body);

      return updateLocation(params.id, input);
    },
  );

  app.delete(
    "/locations/:id",
    {
      preHandler: [requirePermission("locations.delete")],
    },
    async (request) => {
      const params = request.params as {
        id: string;
      };

      return deleteLocation(params.id);
    },
  );
}