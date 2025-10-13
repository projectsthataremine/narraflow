-- Migration: Add machine name and OS columns to licenses table
-- Date: 2025-10-12
-- Purpose: Support machine identification and renaming in Account UI

-- Add machine info columns
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS machine_name TEXT,
ADD COLUMN IF NOT EXISTS machine_os TEXT;

-- Create RLS policy to allow users to update only their own license machine_name
-- Users must be authenticated and can only update the machine_name field
CREATE POLICY "Users can update their own license machine_name"
ON licenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Ensure only machine_name is being updated by checking all other fields remain unchanged
  (
    -- These fields must not change
    id = id AND
    key = key AND
    user_id = user_id AND
    status = status AND
    machine_id = machine_id AND
    stripe_subscription_id = stripe_subscription_id AND
    stripe_customer_id = stripe_customer_id AND
    stripe_session_id = stripe_session_id AND
    customer_email = customer_email AND
    created_at = created_at AND
    expires_at = expires_at
  )
);

-- Comment on columns for documentation
COMMENT ON COLUMN licenses.machine_name IS 'User-editable friendly name for the machine (e.g., "MacBook Pro 2024")';
COMMENT ON COLUMN licenses.machine_os IS 'Operating system version (e.g., "macOS 15.0 Sequoia")';
