#!/usr/bin/env node
// ================================================================
// Fix seed user password hashes in Supabase
// Run: node scripts/fix-seed-passwords.js
// ================================================================
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const dns = require('node:dns/promises');

async function verifySupabaseHost() {
  const rawUrl = process.env.SUPABASE_URL;
  if (!rawUrl) {
    throw new Error('SUPABASE_URL is missing in .env');
  }

  const hostname = new URL(rawUrl).hostname;
  try {
    await dns.lookup(hostname);
  } catch (_err) {
    throw new Error(
      `Cannot resolve Supabase host: ${hostname}. Check SUPABASE_URL in .env (project ref may be wrong).`,
    );
  }
}

async function main() {
  const { createClient } = require('@supabase/supabase-js');

  await verifySupabaseHost();

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
    console.error('Hint: ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY target a live project.');
    process.exit(1);
  }

  console.log('\nUpdated users:');
  (data ?? []).forEach(u => console.log(`  ✓ ${u.email} (${u.role})`));
  console.log('\nAll passwords set to: password123');
}

main().catch(e => { console.error(e); process.exit(1); });
