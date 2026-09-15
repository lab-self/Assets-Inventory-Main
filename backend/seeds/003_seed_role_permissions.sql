-- ============================================================
-- 003_seed_role_permissions.sql
-- Default Role → Permission Mapping
-- ============================================================

-- ============================================================
-- SUPER ADMIN
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================================
-- ADMIN
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',

        'ASSET_VIEW',
        'ASSET_CREATE',
        'ASSET_UPDATE',
        'ASSET_DELETE',
        'ASSET_ASSIGN',
        'ASSET_RETURN',
        'ASSET_IMPORT',
        'ASSET_EXPORT',

        'USER_VIEW',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'USER_ROLE_MANAGE',

        'COMPANY_VIEW',
        'COMPANY_CREATE',
        'COMPANY_UPDATE',
        'COMPANY_DELETE',

        'DEPARTMENT_VIEW',
        'DEPARTMENT_CREATE',
        'DEPARTMENT_UPDATE',
        'DEPARTMENT_DELETE',

        'LOCATION_VIEW',
        'LOCATION_CREATE',
        'LOCATION_UPDATE',
        'LOCATION_DELETE',

        'CATEGORY_MANAGE',
        'STATUS_MANAGE',

        'AUTODESK_VIEW',
        'AUTODESK_MANAGE',

        'TEAMS_VIEW',
        'TEAMS_MANAGE',

        'REPORT_VIEW',
        'REPORT_EXPORT',

        'AUDIT_VIEW',

        'SETTING_VIEW',
        'SETTING_MANAGE'
    )
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================================
-- INVENTORY MANAGER
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',

        'ASSET_VIEW',
        'ASSET_CREATE',
        'ASSET_UPDATE',
        'ASSET_ASSIGN',
        'ASSET_RETURN',
        'ASSET_IMPORT',
        'ASSET_EXPORT',

        'USER_VIEW',

        'COMPANY_VIEW',

        'DEPARTMENT_VIEW',

        'LOCATION_VIEW',

        'CATEGORY_MANAGE',
        'STATUS_MANAGE',

        'AUTODESK_VIEW',
        'AUTODESK_MANAGE',

        'TEAMS_VIEW',
        'TEAMS_MANAGE',

        'REPORT_VIEW',
        'REPORT_EXPORT'
    )
WHERE r.code = 'INVENTORY_MANAGER'
ON CONFLICT DO NOTHING;

-- ============================================================
-- IT SUPPORT
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',

        'ASSET_VIEW',
        'ASSET_CREATE',
        'ASSET_UPDATE',
        'ASSET_ASSIGN',
        'ASSET_RETURN',
        'ASSET_IMPORT',
        'ASSET_EXPORT',

        'USER_VIEW',

        'COMPANY_VIEW',
        'DEPARTMENT_VIEW',
        'LOCATION_VIEW',

        'AUTODESK_VIEW',
        'AUTODESK_MANAGE',

        'TEAMS_VIEW',
        'TEAMS_MANAGE',

        'REPORT_VIEW',
        'REPORT_EXPORT'
    )
WHERE r.code = 'IT_SUPPORT'
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIEWER
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',
        'ASSET_VIEW',
        'USER_VIEW',
        'COMPANY_VIEW',
        'DEPARTMENT_VIEW',
        'LOCATION_VIEW',
        'AUTODESK_VIEW',
        'TEAMS_VIEW',
        'REPORT_VIEW'
    )
WHERE r.code = 'VIEWER'
ON CONFLICT DO NOTHING;