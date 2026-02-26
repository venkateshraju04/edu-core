import { z } from 'zod';

export const createFeeSchema = z.object({
  student_id:    z.string().uuid(),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-YY format, e.g. 2025-26'),
  term:          z.number().int().min(1).max(3),
  amount_due:    z.number().positive(),
  due_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
});

export const updateFeeSchema = z.object({
  amount_paid: z.number().min(0),
  paid_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateFeeInput  = z.infer<typeof createFeeSchema>;
export type UpdateFeeInput  = z.infer<typeof updateFeeSchema>;
