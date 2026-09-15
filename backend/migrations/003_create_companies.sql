-- ============================================================
-- Inventory Management
-- Migration 003
-- Companies
-- ============================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,

    legal_name VARCHAR(250),

    description TEXT,

    email CITEXT,
    phone VARCHAR(50),

    website VARCHAR(500),

    address_line_1 VARCHAR(250),
    address_line_2 VARCHAR(250),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_companies_name UNIQUE (name)
);


CREATE INDEX idx_companies_active
    ON companies(is_active);

CREATE INDEX idx_companies_name
    ON companies(name);