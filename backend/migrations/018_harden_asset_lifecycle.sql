-- ============================================================
-- Inventory Management
-- Migration 018
-- Align asset lifecycle schema with application services.
-- Safe for existing installations: additive changes only.
-- ============================================================

ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS department_id UUID NULL;

ALTER TABLE assets
    ADD CONSTRAINT fk_assets_department
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_department
    ON assets(department_id);

ALTER TABLE asset_assignments
    ADD COLUMN IF NOT EXISTS expected_return_at TIMESTAMPTZ NULL;

ALTER TABLE asset_assignments
    ADD COLUMN IF NOT EXISTS condition_on_return VARCHAR(50) NULL;

ALTER TABLE asset_assignments
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE asset_assignments
    DROP CONSTRAINT IF EXISTS chk_asset_assignments_returned_at;

ALTER TABLE asset_assignments
    ADD CONSTRAINT chk_asset_assignments_returned_at
    CHECK (
        returned_at IS NULL
        OR returned_at >= assigned_at
    );

ALTER TABLE asset_assignments
    ADD CONSTRAINT chk_asset_assignments_expected_return
    CHECK (
        expected_return_at IS NULL
        OR expected_return_at >= assigned_at
    );

ALTER TABLE asset_assignments
    ADD CONSTRAINT chk_asset_assignments_condition_on_return
    CHECK (
        condition_on_return IS NULL
        OR condition_on_return IN ('new','good','fair','poor','damaged')
    );

CREATE INDEX IF NOT EXISTS idx_asset_assignments_expected_return
    ON asset_assignments(expected_return_at);

-- Ensure only one active assignment exists for an asset.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_assignments_active_asset
    ON asset_assignments(asset_id)
    WHERE assignment_status = 'assigned'
      AND returned_at IS NULL;
