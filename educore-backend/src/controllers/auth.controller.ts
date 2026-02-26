import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/db';
import { signToken } from '../utils/jwt';
import { loginSchema } from '../validations/auth.schema';
import { AppError } from '../middleware/errorHandler';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    // Fetch user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role, department_id, is_active')
      .eq('email', body.email)
      .single();

    if (error || !user) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (!user.is_active) {
      throw new AppError(403, 'Account is deactivated');
    }

    if (user.role !== body.role) {
      throw new AppError(401, 'Role does not match');
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password_hash);
    if (!passwordMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Fetch class IDs if teacher
    let classIds: string[] = [];
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        const { data: ct } = await supabaseAdmin
          .from('class_teachers')
          .select('class_id')
          .eq('teacher_id', teacher.id);
        classIds = (ct ?? []).map((r: { class_id: string }) => r.class_id);
      }
    }

    const token = signToken({
      userId:       user.id,
      name:         user.name,
      role:         user.role,
      departmentId: user.department_id ?? null,
      classIds,
    });

    res.json({
      success: true,
      token,
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        departmentId: user.department_id,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // With stateless JWT there's no server-side invalidation unless you maintain a denylist.
  // For now, instruct the client to discard the token.
  res.json({ success: true, message: 'Logged out. Discard your token on the client.' });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, department_id, profile_photo, is_active, created_at')
      .eq('id', req.user!.userId)
      .single();

    if (error || !user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
