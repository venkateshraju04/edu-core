#!/usr/bin/env node
// ================================================================
// Fix seed user password hashes in Supabase
// Run: node scripts/fix-seed-passwords.js
// ================================================================
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');

async function main() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const plaintext = 'password123';
  const hash = await bcrypt.hash(plaintext, 10);
  console.log('Generated hash:', hash);

  const emails = [
    'admin@educore.school',
    'principal@educore.school',
    'hod@educore.school',
    'teacher@educore.school',
  ];

  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .in('email', emails)
    .select('email, role');

  if (error) {
    console.error('Error updating passwords:', error.message);
    process.exit(1);
  }

  console.log('\nUpdated users:');
  (data ?? []).forEach(u => console.log(`  ✓ ${u.email} (${u.role})`));
  console.log('\nAll passwords set to: password123');
}

main().catch(e => { console.error(e); process.exit(1); });
