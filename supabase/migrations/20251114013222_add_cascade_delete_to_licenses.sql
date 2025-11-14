-- Add CASCADE DELETE to licenses.user_id foreign key
-- When a user is deleted from auth.users, their licenses will be automatically deleted

-- Drop the existing foreign key constraint
ALTER TABLE licenses
DROP CONSTRAINT IF EXISTS licenses_user_id_fkey;

-- Re-add the foreign key with ON DELETE CASCADE
ALTER TABLE licenses
ADD CONSTRAINT licenses_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
