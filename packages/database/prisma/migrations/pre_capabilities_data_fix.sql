-- Migration helper: Update BUSINESS users to USER before schema change
-- Run this before applying new schema

DO $$
BEGIN
  -- Update all BUSINESS role users to USER
  UPDATE users 
  SET role = 'USER'::"UserRole"
  WHERE role::"UserRole" = 'BUSINESS'::"UserRole";
  
  RAISE NOTICE 'Updated users from BUSINESS to USER';
END$$;
