import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const bulkMarkSchema = z.object({
  class_id: z.string().uuid(),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records:  z.array(z.object({
    student_id: z.string().uuid(),
    is_present: z.boolean(),
  })).min(1),
});

export async function getStudentSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('date, is_present')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw new AppError(500, error.message);

    const total   = data.length;
    const present = data.filter(r => r.is_present).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, data: { records: data, total, present, absent: total - present, percentage } });
  } catch (err) {
    next(err);
  }
}

export async function getClassByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { classId, date } = req.params;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*, students(first_name, last_name, roll_number)')
      .eq('class_id', classId)
      .eq('date', date)
      .order('students(roll_number)');

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function bulkMark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { class_id, date, records } = bulkMarkSchema.parse(req.body);
    const markedBy = req.user!.userId;

    const rows = records.map(r => ({
      student_id: r.student_id,
      class_id,
      date,
      is_present: r.is_present,
      marked_by:  markedBy,
    }));

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,class_id,date' })
      .select();

    if (error) throw new AppError(400, error.message);

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}
