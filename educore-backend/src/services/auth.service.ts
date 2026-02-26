/**
 * auth.service.ts
 * Shared auth helpers (e.g. creating a user with hashed password).
 */
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';

export interface CreateUserPayload {
  name:          string;
  email:         string;
  password:      string;
  role:          'admin' | 'principal' | 'hod' | 'teacher';
  department_id?: string;
}

export async function createUser(payload: CreateUserPayload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      name:          payload.name,
      email:         payload.email,
      password_hash: passwordHash,
      role:          payload.role,
      department_id: payload.department_id ?? null,
    })
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data;
}

export async function deactivateUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) throw new AppError(500, error.message);
}
