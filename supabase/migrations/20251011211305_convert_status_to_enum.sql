-- Drop the check constraint first
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_status_check;

-- Drop the function CASCADE (this will drop all dependent triggers)
DROP FUNCTION IF EXISTS update_license_status() CASCADE;

-- Create enum type for license status
CREATE TYPE license_status AS ENUM ('pending', 'active', 'canceled', 'expired');

-- Remove default temporarily
ALTER TABLE licenses ALTER COLUMN status DROP DEFAULT;

-- Convert the status column to use the enum type
ALTER TABLE licenses 
  ALTER COLUMN status TYPE license_status 
  USING status::license_status;

-- Re-add default using enum
ALTER TABLE licenses ALTER COLUMN status SET DEFAULT 'active'::license_status;

-- Recreate the function with proper enum handling
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expires_at < NOW() AND NEW.status = 'active'::license_status THEN
    NEW.status := 'expired'::license_status;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER license_expiration_check
  BEFORE INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_license_status();
