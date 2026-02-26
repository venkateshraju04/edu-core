import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['admin', 'principal', 'hod', 'teacher']),
});

export type LoginInput = z.infer<typeof loginSchema>;
