import { z } from 'zod';

const envSchema = z.object({
  PORT:                    z.string().default('5000').transform(Number),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL:            z.string().url(),
  SUPABASE_ANON_KEY:       z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET:              z.string().min(32),
  JWT_EXPIRES_IN:          z.string().default('8h'),
  FRONTEND_URL:            z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR:              z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
