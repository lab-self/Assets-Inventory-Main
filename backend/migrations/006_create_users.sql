-- ============================================================
-- Inventory Management
-- Migration 006
-- Users
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID,

    department_id UUID,

    location_id UUID,

    employee_id VARCHAR(100),

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email CITEXT NOT NULL,

    phone VARCHAR(50),

    password_hash TEXT NOT NULL,

    job_title VARCHAR(150),

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,

    last_login_at TIMESTAMPTZ,

    password_changed_at TIMESTAMPTZ,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_users_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_users_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_users_email
        UNIQUE (email),

    CONSTRAINT uq_users_employee_id
        UNIQUE (employee_id),

    CONSTRAINT chk_users_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended',
                'locked'
            )
        ),

    CONSTRAINT chk_users_failed_login_attempts
        CHECK (
            failed_login_attempts >= 0
        )
);


CREATE INDEX idx_users_company
    ON users(company_id);

CREATE INDEX idx_users_department
    ON users(department_id);

CREATE INDEX idx_users_location
    ON users(location_id);

CREATE INDEX idx_users_status
    ON users(status);

CREATE INDEX idx_users_last_name
    ON users(last_name);