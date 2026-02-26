-- ================================================================
-- EduCore — Fix Password Hashes
-- Run this in Supabase SQL editor if you already ran seed.sql
-- with the old incorrect hash. This updates all seed users to
-- use the correct bcrypt hash for "password123".
-- ================================================================

UPDATE users
SET password_hash = '$2a$10$scUFjUpVGlhE2IciHVVxH.r4wGMfYkT7tTY/zjiRgQJTv2jx6qpfS'
WHERE email IN (
  'admin@educore.school',
  'principal@educore.school',
  'hod@educore.school',
  'teacher@educore.school'
);
