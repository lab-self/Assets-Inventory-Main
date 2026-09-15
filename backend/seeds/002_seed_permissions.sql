-- ============================================================
-- 002_seed_permissions.sql
-- Application Permissions
-- ============================================================

INSERT INTO permissions (
    name,
    code,
    description,
    module,
    action,
    is_active
)
VALUES

-- ============================================================
-- Dashboard
-- ============================================================

(
    'View Dashboard',
    'DASHBOARD_VIEW',
    'View dashboard statistics and summaries.',
    'dashboard',
    'view',
    TRUE
),

-- ============================================================
-- Assets
-- ============================================================

(
    'View Assets',
    'ASSET_VIEW',
    'View asset inventory.',
    'assets',
    'view',
    TRUE
),
(
    'Create Assets',
    'ASSET_CREATE',
    'Create new assets.',
    'assets',
    'create',
    TRUE
),
(
    'Update Assets',
    'ASSET_UPDATE',
    'Update asset information.',
    'assets',
    'update',
    TRUE
),
(
    'Delete Assets',
    'ASSET_DELETE',
    'Delete or retire assets.',
    'assets',
    'delete',
    TRUE
),
(
    'Assign Assets',
    'ASSET_ASSIGN',
    'Assign assets to employees.',
    'assets',
    'assign',
    TRUE
),
(
    'Return Assets',
    'ASSET_RETURN',
    'Return assets from employees.',
    'assets',
    'return',
    TRUE
),
(
    'Import Assets',
    'ASSET_IMPORT',
    'Import assets from Excel or CSV files.',
    'assets',
    'import',
    TRUE
),
(
    'Export Assets',
    'ASSET_EXPORT',
    'Export inventory data.',
    'assets',
    'export',
    TRUE
),

-- ============================================================
-- Users
-- ============================================================

(
    'View Users',
    'USER_VIEW',
    'View employee and user information.',
    'users',
    'view',
    TRUE
),
(
    'Create Users',
    'USER_CREATE',
    'Create users and employees.',
    'users',
    'create',
    TRUE
),
(
    'Update Users',
    'USER_UPDATE',
    'Update user information.',
    'users',
    'update',
    TRUE
),
(
    'Delete Users',
    'USER_DELETE',
    'Deactivate users.',
    'users',
    'delete',
    TRUE
),
(
    'Manage User Roles',
    'USER_ROLE_MANAGE',
    'Assign and remove user roles.',
    'users',
    'manage_roles',
    TRUE
),

-- ============================================================
-- Companies
-- ============================================================

(
    'View Companies',
    'COMPANY_VIEW',
    'View companies.',
    'companies',
    'view',
    TRUE
),
(
    'Create Companies',
    'COMPANY_CREATE',
    'Create companies.',
    'companies',
    'create',
    TRUE
),
(
    'Update Companies',
    'COMPANY_UPDATE',
    'Update company information.',
    'companies',
    'update',
    TRUE
),
(
    'Delete Companies',
    'COMPANY_DELETE',
    'Deactivate companies.',
    'companies',
    'delete',
    TRUE
),

-- ============================================================
-- Departments
-- ============================================================

(
    'View Departments',
    'DEPARTMENT_VIEW',
    'View departments.',
    'departments',
    'view',
    TRUE
),
(
    'Create Departments',
    'DEPARTMENT_CREATE',
    'Create departments.',
    'departments',
    'create',
    TRUE
),
(
    'Update Departments',
    'DEPARTMENT_UPDATE',
    'Update department information.',
    'departments',
    'update',
    TRUE
),
(
    'Delete Departments',
    'DEPARTMENT_DELETE',
    'Deactivate departments.',
    'departments',
    'delete',
    TRUE
),

-- ============================================================
-- Locations
-- ============================================================

(
    'View Locations',
    'LOCATION_VIEW',
    'View locations.',
    'locations',
    'view',
    TRUE
),
(
    'Create Locations',
    'LOCATION_CREATE',
    'Create locations.',
    'locations',
    'create',
    TRUE
),
(
    'Update Locations',
    'LOCATION_UPDATE',
    'Update location information.',
    'locations',
    'update',
    TRUE
),
(
    'Delete Locations',
    'LOCATION_DELETE',
    'Deactivate locations.',
    'locations',
    'delete',
    TRUE
),

-- ============================================================
-- Categories / Statuses
-- ============================================================

(
    'Manage Asset Categories',
    'CATEGORY_MANAGE',
    'Manage asset categories.',
    'categories',
    'manage',
    TRUE
),
(
    'Manage Asset Statuses',
    'STATUS_MANAGE',
    'Manage asset statuses.',
    'statuses',
    'manage',
    TRUE
),

-- ============================================================
-- Autodesk
-- ============================================================

(
    'View Autodesk Licenses',
    'AUTODESK_VIEW',
    'View Autodesk license records.',
    'autodesk',
    'view',
    TRUE
),
(
    'Manage Autodesk Licenses',
    'AUTODESK_MANAGE',
    'Create and manage Autodesk licenses.',
    'autodesk',
    'manage',
    TRUE
),

-- ============================================================
-- Microsoft Teams
-- ============================================================

(
    'View Teams Accounts',
    'TEAMS_VIEW',
    'View Microsoft Teams accounts.',
    'teams',
    'view',
    TRUE
),
(
    'Manage Teams Accounts',
    'TEAMS_MANAGE',
    'Manage Microsoft Teams accounts.',
    'teams',
    'manage',
    TRUE
),

-- ============================================================
-- Reports
-- ============================================================

(
    'View Reports',
    'REPORT_VIEW',
    'View inventory reports.',
    'reports',
    'view',
    TRUE
),
(
    'Export Reports',
    'REPORT_EXPORT',
    'Export inventory reports.',
    'reports',
    'export',
    TRUE
),

-- ============================================================
-- Audit
-- ============================================================

(
    'View Audit Logs',
    'AUDIT_VIEW',
    'View system audit logs.',
    'audit',
    'view',
    TRUE
),

-- ============================================================
-- Settings
-- ============================================================

(
    'View Settings',
    'SETTING_VIEW',
    'View application settings.',
    'settings',
    'view',
    TRUE
),
(
    'Manage Settings',
    'SETTING_MANAGE',
    'Update application settings.',
    'settings',
    'manage',
    TRUE
),

-- ============================================================
-- System Administration
-- ============================================================

(
    'Manage Roles',
    'ROLE_MANAGE',
    'Create and manage application roles.',
    'roles',
    'manage',
    TRUE
)

ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    module = EXCLUDED.module,
    action = EXCLUDED.action,
    is_active = EXCLUDED.is_active;