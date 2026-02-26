import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const assignHodSchema = z.object({
  hod_user_id: z.string().uuid(),
});

const assignTeacherSchema = z.object({
  teacher_id: z.string().uuid(),
  class_id:   z.string().uuid(),
  subject:    z.string().min(1).max(100),
});

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*, users!fk_departments_hod(name, email)')
      .order('name');

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assignHod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { hod_user_id } = assignHodSchema.parse(req.body);

    // Verify the user has role 'hod'
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', hod_user_id)
      .single();

    if (userErr || !user) throw new AppError(404, 'User not found');
    if (user.role !== 'hod') throw new AppError(400, 'User must have the HOD role');

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ hod_id: hod_user_id })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Department not found');

    // Keep user.department_id in sync
    await supabaseAdmin.from('users').update({ department_id: id }).eq('id', hod_user_id);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assignTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = assignTeacherSchema.parse(req.body);
    const user = req.user!;

    // Verify teacher belongs to HOD's department
    const { data: teacher, error: teacherErr } = await supabaseAdmin
      .from('teachers')
      .select('id, department_id')
      .eq('id', body.teacher_id)
      .single();

    if (teacherErr || !teacher) throw new AppError(404, 'Teacher not found');
    if (user.departmentId && teacher.department_id !== user.departmentId) {
      throw new AppError(403, 'Teacher does not belong to your department');
    }

    const { data, error } = await supabaseAdmin
      .from('class_teachers')
      .upsert(
        { teacher_id: body.teacher_id, class_id: body.class_id, subject: body.subject, assigned_by: user.userId },
        { onConflict: 'teacher_id,class_id,subject' }
      )
      .select()
      .single();

    if (error) throw new AppError(400, error.message);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
