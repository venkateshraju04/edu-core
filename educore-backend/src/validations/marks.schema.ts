import { z } from 'zod';

export const createMarkSchema = z.object({
  student_id:      z.string().uuid(),
  class_id:        z.string().uuid(),
  subject:         z.string().min(1).max(100),
  exam_type:       z.enum(['ia1', 'ia2', 'midterm', 'final_exam', 'assignment']),
  assignment_no:   z.number().int().positive().optional(),
  max_marks:       z.number().positive(),
  marks_obtained:  z.number().min(0),
  academic_year:   z.string().regex(/^\d{4}-\d{2}$/),
}).refine(
  (d) => d.marks_obtained <= d.max_marks,
  { message: 'marks_obtained cannot exceed max_marks', path: ['marks_obtained'] }
);

export const updateMarkSchema = z.object({
  marks_obtained: z.number().min(0),
  max_marks:      z.number().positive().optional(),
});

export type CreateMarkInput  = z.infer<typeof createMarkSchema>;
export type UpdateMarkInput  = z.infer<typeof updateMarkSchema>;
