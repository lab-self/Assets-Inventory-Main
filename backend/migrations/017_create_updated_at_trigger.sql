-- ============================================================
-- 017_create_updated_at_trigger.sql
-- Automatic updated_at Maintenance
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- Roles / Permissions
-- ============================================================

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Organization
-- ============================================================

CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Asset Management
-- ============================================================

CREATE TRIGGER trg_asset_categories_updated_at
BEFORE UPDATE ON asset_categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_asset_statuses_updated_at
BEFORE UPDATE ON asset_statuses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_asset_assignments_updated_at
BEFORE UPDATE ON asset_assignments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Licenses / Accounts
-- ============================================================

CREATE TRIGGER trg_autodesk_licenses_updated_at
BEFORE UPDATE ON autodesk_licenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_teams_accounts_updated_at
BEFORE UPDATE ON teams_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Application
-- ============================================================

CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();