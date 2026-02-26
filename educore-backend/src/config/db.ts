import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Admin client (service role) — bypasses Row Level Security.
 * USE ONLY SERVER-SIDE. Never expose the service role key to the browser.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Anon client — for basic public reads if needed.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
