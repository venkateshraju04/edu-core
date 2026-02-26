/**
 * students.service.ts
 * Shared helpers for student data queries.
 */
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';

/**
 * Get a student with their class info. Throws 404 if not found.
 */
export async function getStudentById(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*, classes(name, grade, section)')
    .eq('id', studentId)
    .single();

  if (error || !data) throw new AppError(404, 'Student not found');
  return data;
}

/**
 * Returns the next available roll number for a given class.
 */
export async function getNextRollNumber(classId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('students')
    .select('roll_number')
    .eq('class_id', classId)
    .order('roll_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.roll_number ?? 0) + 1;
}

/**
 * Compute attendance percentage for a student.
 */
export async function getAttendancePercentage(studentId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('is_present')
    .eq('student_id', studentId);

  if (error || !data || data.length === 0) return 0;

  const present = data.filter(r => r.is_present).length;
  return Math.round((present / data.length) * 100);
}
