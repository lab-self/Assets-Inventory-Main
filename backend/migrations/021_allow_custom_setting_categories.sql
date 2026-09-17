-- The settings form supports custom categories, so permit non-empty labels.
ALTER TABLE settings DROP CONSTRAINT chk_settings_category;
ALTER TABLE settings ADD CONSTRAINT chk_settings_category
  CHECK (length(btrim(category)) BETWEEN 1 AND 50);
