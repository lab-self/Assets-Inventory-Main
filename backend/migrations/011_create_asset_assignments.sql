-- ============================================================
-- Inventory Management
-- Migration 011
-- Asset Assignments / Lifecycle History
-- ============================================================

CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_id UUID NOT NULL,

    user_id UUID NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    returned_at TIMESTAMPTZ,

    assignment_status VARCHAR(30) NOT NULL DEFAULT 'assigned',

    assigned_by UUID,

    returned_by UUID,

    assignment_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_asset_assignments_asset
        FOREIGN KEY (asset_id)
        REFERENCES assets(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asset_assignments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asset_assignments_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_asset_assignments_returned_by
        FOREIGN KEY (returned_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_asset_assignments_status
        CHECK (
            assignment_status IN (
                'assigned',
                'returned',
                'cancelled'
            )
        ),

    CONSTRAINT chk_asset_assignments_returned_at
        CHECK (
            returned_at IS NULL
            OR returned_at >= assigned_at
        )
);


CREATE INDEX idx_asset_assignments_asset
    ON asset_assignments(asset_id);

CREATE INDEX idx_asset_assignments_user
    ON asset_assignments(user_id);

CREATE INDEX idx_asset_assignments_status
    ON asset_assignments(assignment_status);

CREATE INDEX idx_asset_assignments_assigned_at
    ON asset_assignments(assigned_at);

CREATE INDEX idx_asset_assignments_returned_at
    ON asset_assignments(returned_at);

CREATE UNIQUE INDEX uq_asset_assignments_active_asset
    ON asset_assignments(asset_id)
    WHERE assignment_status = 'assigned'
      AND returned_at IS NULL;