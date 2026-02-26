import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const timetableSlotSchema = z.object({
  class_id:      z.string().uuid(),
  day_of_week:   z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  period_number: z.number().int().min(1).max(8),
  start_time:    z.string().regex(/^\d{2}:\d{2}$/),
  end_time:      z.string().regex(/^\d{2}:\d{2}$/),
  subject:       z.string().min(1).max(100),
  teacher_id:    z.string().uuid().optional(),
  room:          z.string().optional(),
});

export async function getByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { classId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .select('*, teachers(users(name))')
      .eq('class_id', classId)
      .order('day_of_week')
      .order('period_number');

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = timetableSlotSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .insert({ ...body, updated_by: req.user!.userId })
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
    const body = timetableSlotSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .update({ ...body, updated_by: req.user!.userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Timetable slot not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('timetable')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(400, error.message);

    res.json({ success: true, message: 'Timetable slot deleted' });
  } catch (err) {
    next(err);
  }
}
