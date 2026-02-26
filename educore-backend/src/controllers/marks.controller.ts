import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { createMarkSchema, updateMarkSchema } from '../validations/marks.schema';
import { AppError } from '../middleware/errorHandler';

export async function getByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { studentId } = req.params;
    const { academic_year } = req.query;

    let query = supabaseAdmin
      .from('marks')
      .select('*')
      .eq('student_id', studentId)
      .order('subject')
      .order('exam_type');

    if (academic_year) query = query.eq('academic_year', academic_year as string);

    const { data, error } = await query;
    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createMarkSchema.parse(req.body);

    // Insert mark; update if already exists via a follow-up PUT
    const { data, error } = await supabaseAdmin
      .from('marks')
      .insert({ ...body, entered_by: req.user!.userId })
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
    const body = updateMarkSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('marks')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Mark record not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
