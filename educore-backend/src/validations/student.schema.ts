import { z } from 'zod';

export const createStudentSchema = z.object({
  roll_number:     z.number().int().positive(),
  first_name:      z.string().min(1).max(100),
  last_name:       z.string().min(1).max(100),
  date_of_birth:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  gender:          z.enum(['male', 'female', 'other']),
  class_id:        z.string().uuid(),
  parent_name:     z.string().min(1).max(150),
  parent_email:    z.string().email().optional().or(z.literal('')),
  parent_phone:    z.string().min(7).max(20),
  address:         z.string().optional(),
  previous_school: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
