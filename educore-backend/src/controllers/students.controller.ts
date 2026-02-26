import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { createStudentSchema, updateStudentSchema } from '../validations/student.schema';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildMeta } from '../utils/pagination';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { class_id } = req.query;

    let query = supabaseAdmin
      .from('students')
      .select('*, classes(name, grade, section)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (class_id) query = query.eq('class_id', class_id as string);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data, meta: buildMeta(page, limit, count ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function listByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { classId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('roll_number', { ascending: true });

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
      .from('students')
      .select('*, classes(name, grade, section)')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Student not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createStudentSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert(body)
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
    const body = updateStudentSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Student not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
