-- ============================================================
-- Inventory Management
-- Migration 008
-- Asset Categories
-- ============================================================

CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(100) NOT NULL,

    description TEXT,

    is_system_category BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asset_categories_name
        UNIQUE (name),

    CONSTRAINT uq_asset_categories_code
        UNIQUE (code)
);


CREATE INDEX idx_asset_categories_active
    ON asset_categories(is_active);

CREATE INDEX idx_asset_categories_name
    ON asset_categories(name);