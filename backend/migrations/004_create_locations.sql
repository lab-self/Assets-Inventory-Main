-- ============================================================
-- Inventory Management
-- Migration 004
-- Locations
-- ============================================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    address_line_1 VARCHAR(250),
    address_line_2 VARCHAR(250),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),

    floor VARCHAR(100),
    building VARCHAR(150),
    room VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_locations_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_locations_company_name
        UNIQUE (company_id, name)
);


CREATE INDEX idx_locations_company
    ON locations(company_id);

CREATE INDEX idx_locations_active
    ON locations(is_active);

CREATE INDEX idx_locations_city
    ON locations(city);