-- Add 'testimonial' to the contact type enum
ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_type_check;

ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_type_check
  CHECK (type IN ('bug', 'feature', 'feedback', 'help', 'other', 'testimonial'));
