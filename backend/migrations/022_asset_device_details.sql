ALTER TABLE assets
  ADD COLUMN device_type_name VARCHAR(100),
  ADD COLUMN ram_unit VARCHAR(2) NOT NULL DEFAULT 'GB' CHECK (ram_unit IN ('GB', 'TB')),
  ADD COLUMN storage_unit VARCHAR(2) NOT NULL DEFAULT 'GB' CHECK (storage_unit IN ('GB', 'TB'));

-- Optional Other-device details already use nullable columns in the base schema.
-- Keep a unique generated asset_tag even when the operator supplies no hostname.
