-- Remove machine_id and machine_name columns from licenses table
-- These are no longer needed as we're tracking machines separately

ALTER TABLE licenses
DROP COLUMN IF EXISTS machine_id,
DROP COLUMN IF EXISTS machine_name;
