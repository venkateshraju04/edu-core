import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildMeta } from '../utils/pagination';
import { z } from 'zod';

const createTeacherSchema = z.object({
  // User account fields
  name:          z.string().min(1).max(100),
  email:         z.string().email(),
  password:      z.string().min(8),
  department_id: z.string().uuid(),
  // Teacher profile fields
  employee_id:   z.string().min(1).max(20),
  subjects:      z.array(z.string()).min(1),
  qualification: z.string().optional(),
  joining_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone:         z.string().optional(),
});

const updateTeacherSchema = z.object({
  name:          z.string().optional(),
  department_id: z.string().uuid().optional(),
  subjects:      z.array(z.string()).optional(),
  qualification: z.string().optional(),
  phone:         z.string().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);

    const { data, error, count } = await supabaseAdmin
      .from('teachers')
      .select('*, users(name, email, profile_photo), departments(name)', { count: 'exact' })
      .eq('is_active', true)
      .order('employee_id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data, meta: buildMeta(page, limit, count ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function listByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deptId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('*, users(name, email, profile_photo)')
      .eq('department_id', deptId)
      .eq('is_active', true);

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('*, users(name, email, profile_photo, created_at), departments(name), class_teachers(class_id, subject, classes(name))')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Teacher not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createTeacherSchema.parse(req.body);

    // Create the user account first
    const passwordHash = await bcrypt.hash(body.password, 10);

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name:          body.name,
        email:         body.email,
        password_hash: passwordHash,
        role:          'teacher',
        department_id: body.department_id,
      })
      .select()
      .single();

    if (userError) throw new AppError(400, userError.message);

    // Create the teacher profile
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id:       user.id,
        employee_id:   body.employee_id,
        department_id: body.department_id,
        subjects:      body.subjects,
        qualification: body.qualification,
        joining_date:  body.joining_date,
        phone:         body.phone,
      })
      .select()
      .single();

    if (teacherError) {
      // Rollback user if teacher insert fails
      await supabaseAdmin.from('users').delete().eq('id', user.id);
      throw new AppError(400, teacherError.message);
    }

    res.status(201).json({ success: true, data: { ...teacher, user } });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateTeacherSchema.parse(req.body);

    // Update teacher profile
    const { name, department_id, ...teacherFields } = body;

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .update(teacherFields)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Teacher not found');

    // Update user fields if present
    if (name || department_id) {
      await supabaseAdmin
        .from('users')
        .update({ ...(name && { name }), ...(department_id && { department_id }) })
        .eq('id', data.user_id);
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
