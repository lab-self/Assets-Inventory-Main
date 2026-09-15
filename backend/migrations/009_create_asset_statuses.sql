-- ============================================================
-- Inventory Management
-- Migration 009
-- Asset Statuses
-- ============================================================

CREATE TABLE asset_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    code VARCHAR(100) NOT NULL,

    description TEXT,

    is_system_status BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asset_statuses_name
        UNIQUE (name),

    CONSTRAINT uq_asset_statuses_code
        UNIQUE (code)
);


CREATE INDEX idx_asset_statuses_active
    ON asset_statuses(is_active);

CREATE INDEX idx_asset_statuses_name
    ON asset_statuses(name);