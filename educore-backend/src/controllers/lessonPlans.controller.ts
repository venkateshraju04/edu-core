import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildMeta } from '../utils/pagination';
import { z } from 'zod';

const createPlanSchema = z.object({
  class_id:   z.string().uuid(),
  subject:    z.string().min(1).max(100),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topic:      z.string().min(1).max(200),
  objectives: z.string().min(1),
  materials:  z.string().optional(),
  activities: z.string().min(1),
  assessment: z.string().optional(),
});

const rejectSchema = z.object({
  hod_remarks: z.string().min(1),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status } = req.query;
    const user = req.user!;

    let query = supabaseAdmin
      .from('lesson_plans')
      .select('*, teachers(id, users(name)), classes(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Teachers see only their own plans
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.userId)
        .single();

      if (teacher) query = query.eq('teacher_id', teacher.id);
    }

    // HOD sees only plans in their department (via teachers)
    if (user.role === 'hod' && user.departmentId) {
      const { data: deptTeachers } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('department_id', user.departmentId);

      const ids = (deptTeachers ?? []).map((t: { id: string }) => t.id);
      if (ids.length) query = query.in('teacher_id', ids);
    }

    if (status) query = query.eq('status', status as string);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data, meta: buildMeta(page, limit, count ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('lesson_plans')
      .select('*, teachers(id, users(name)), classes(name), users!lesson_plans_reviewed_by_fkey(name)')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Lesson plan not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createPlanSchema.parse(req.body);
    const user = req.user!;

    const { data: teacher, error: teacherErr } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (teacherErr || !teacher) throw new AppError(400, 'Teacher profile not found for this user');

    const { data, error } = await supabaseAdmin
      .from('lesson_plans')
      .insert({ ...body, teacher_id: teacher.id, status: 'pending' })
      .select()
      .single();

    if (error) throw new AppError(400, error.message);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = createPlanSchema.partial().parse(req.body);

    // Only allow editing if still pending
    const { data, error } = await supabaseAdmin
      .from('lesson_plans')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Lesson plan not found or not editable');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('lesson_plans')
      .update({
        status:      'approved',
        reviewed_by: req.user!.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Lesson plan not found or already reviewed');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { hod_remarks } = rejectSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('lesson_plans')
      .update({
        status:      'rejected',
        reviewed_by: req.user!.userId,
        reviewed_at: new Date().toISOString(),
        hod_remarks,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Lesson plan not found or already reviewed');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
