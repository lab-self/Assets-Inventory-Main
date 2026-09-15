-- ============================================================
-- Inventory Management
-- Migration 001
-- PostgreSQL Extensions
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;