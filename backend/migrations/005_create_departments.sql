-- ============================================================
-- Inventory Management
-- Migration 005
-- Departments
-- ============================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    manager_name VARCHAR(200),

    email CITEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_departments_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_departments_company_name
        UNIQUE (company_id, name)
);


CREATE INDEX idx_departments_company
    ON departments(company_id);

CREATE INDEX idx_departments_active
    ON departments(is_active);

CREATE INDEX idx_departments_name
    ON departments(name);