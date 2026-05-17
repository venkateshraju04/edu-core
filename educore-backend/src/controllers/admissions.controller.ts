import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildMeta } from '../utils/pagination';
import { z } from 'zod';

const createAdmissionSchema = z.object({
  first_name:      z.string().min(1).max(100),
  last_name:       z.string().min(1).max(100),
  date_of_birth:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender:          z.enum(['male', 'female', 'other']),
  grade_applying:  z.number().int().min(1).max(10),
  parent_name:     z.string().min(1).max(150),
  parent_email:    z.string().email().optional().or(z.literal('')),
  parent_phone:    z.string().min(7).max(20),
  address:         z.string().optional(),
  previous_school: z.string().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status } = req.query;

    let query = supabaseAdmin
      .from('admissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data, meta: buildMeta(page, limit, count ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createAdmissionSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('admissions')
      .insert(body)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const requestedClassId = req.body?.class_id as string | undefined;

    // Fetch admission
    const { data: admission, error: fetchErr } = await supabaseAdmin
      .from('admissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !admission) throw new AppError(404, 'Admission not found');
    if (admission.status !== 'pending') throw new AppError(400, 'Admission is already processed');

    let classId = requestedClassId;
    if (!classId) {
      const { data: gradeClasses, error: classErr } = await supabaseAdmin
        .from('classes')
        .select('id, section')
        .eq('grade', admission.grade_applying)
        .order('section', { ascending: true })
        .limit(1);

      if (classErr) {
        throw new AppError(500, classErr.message);
      }

      if (gradeClasses && gradeClasses.length > 0) {
        classId = gradeClasses[0].id;
      } else {
        const section = 'A';
        const { data: createdClass, error: createClassErr } = await supabaseAdmin
          .from('classes')
          .insert({
            grade: admission.grade_applying,
            section,
            name: `Grade ${admission.grade_applying}-${section}`,
          })
          .select('id')
          .single();

        if (createClassErr || !createdClass) {
          // If another request created the same class concurrently, re-read and continue.
          const { data: fallbackClasses, error: fallbackErr } = await supabaseAdmin
            .from('classes')
            .select('id')
            .eq('grade', admission.grade_applying)
            .order('section', { ascending: true })
            .limit(1);

          if (fallbackErr || !fallbackClasses || fallbackClasses.length === 0) {
            throw new AppError(500, createClassErr?.message || 'Unable to resolve class for admission');
          }

          classId = fallbackClasses[0].id;
        } else {
          classId = createdClass.id;
        }
      }
    }

    // Determine next roll number for the class
    const { data: lastStudent } = await supabaseAdmin
      .from('students')
      .select('roll_number')
      .eq('class_id', classId)
      .order('roll_number', { ascending: false })
      .limit(1)
      .single();

    const rollNumber = (lastStudent?.roll_number ?? 0) + 1;

    // Create student record
    await supabaseAdmin.from('students').insert({
      roll_number:     rollNumber,
      first_name:      admission.first_name,
      last_name:       admission.last_name,
      date_of_birth:   admission.date_of_birth,
      gender:          admission.gender,
      class_id: classId,
      parent_name:     admission.parent_name,
      parent_email:    admission.parent_email,
      parent_phone:    admission.parent_phone,
      address:         admission.address,
      previous_school: admission.previous_school,
    });

    // Update admission status
    const { data, error } = await supabaseAdmin
      .from('admissions')
      .update({ status: 'approved', reviewed_by: req.user!.userId, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('admissions')
      .update({ status: 'rejected', reviewed_by: req.user!.userId, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Admission not found or already processed');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
