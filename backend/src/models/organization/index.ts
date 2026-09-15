export { organizationRoutes } from "./organization.routes.js";

export {
  getCompany,
  getCompanies,
  createNewCompany,
  updateExistingCompany,
  deactivateExistingCompany,

  getDepartment,
  getDepartments,
  createNewDepartment,
  updateExistingDepartment,
  deactivateExistingDepartment,

  getLocation,
  getLocations,
  createNewLocation,
  updateExistingLocation,
  deactivateExistingLocation
} from "./organization.service.js";