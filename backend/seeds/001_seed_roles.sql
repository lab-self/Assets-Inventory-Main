-- ============================================================
-- 001_seed_roles.sql
-- Default Application Roles
-- ============================================================

INSERT INTO roles (
    name,
    code,
    description,
    is_system_role,
    is_active
)
VALUES
(
    'Super Administrator',
    'SUPER_ADMIN',
    'Full unrestricted access to the Inventory Management system.',
    TRUE,
    TRUE
),
(
    'Administrator',
    'ADMIN',
    'Administrative access to inventory, users, organization and system settings.',
    TRUE,
    TRUE
),
(
    'Inventory Manager',
    'INVENTORY_MANAGER',
    'Manage assets, assignments, categories, statuses and inventory operations.',
    TRUE,
    TRUE
),
(
    'IT Support',
    'IT_SUPPORT',
    'Manage IT assets, assignments and technical inventory information.',
    TRUE,
    TRUE
),
(
    'Viewer',
    'VIEWER',
    'Read-only access to inventory and reports.',
    TRUE,
    TRUE
)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role,
    is_active = EXCLUDED.is_active;