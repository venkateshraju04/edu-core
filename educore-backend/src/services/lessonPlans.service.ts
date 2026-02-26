/**
 * lessonPlans.service.ts
 * Shared helpers for lesson plan queries.
 */
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';

/**
 * Count pending lesson plans for a department (used in HOD dashboard widget).
 */
export async function getPendingCountForDepartment(departmentId: string): Promise<number> {
  const { data: teachers, error: tErr } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('department_id', departmentId);

  if (tErr) throw new AppError(500, tErr.message);

  const teacherIds = (teachers ?? []).map((t: { id: string }) => t.id);
  if (!teacherIds.length) return 0;

  const { count, error } = await supabaseAdmin
    .from('lesson_plans')
    .select('id', { count: 'exact', head: true })
    .in('teacher_id', teacherIds)
    .eq('status', 'pending');

  if (error) throw new AppError(500, error.message);
  return count ?? 0;
}

/**
 * Get lesson plans submitted by a specific teacher.
 */
export async function getPlansByTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('lesson_plans')
    .select('*, classes(name)')
    .eq('teacher_id', teacherId)
    .order('date', { ascending: false });

  if (error) throw new AppError(500, error.message);
  return data;
}
