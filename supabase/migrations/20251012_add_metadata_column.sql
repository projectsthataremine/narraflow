-- Migration: Add metadata JSONB column to licenses table
-- Date: 2025-10-12
-- Purpose: Store machine info and other flexible data in metadata instead of separate columns

-- Add metadata column
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_licenses_metadata ON licenses USING gin (metadata);

-- Comment on column
COMMENT ON COLUMN licenses.metadata IS 'Flexible JSONB field for storing machine info (machine_id, machine_name, machine_os) and other license-related data';
