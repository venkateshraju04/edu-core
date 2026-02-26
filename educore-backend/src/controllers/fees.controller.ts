import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { createFeeSchema, updateFeeSchema } from '../validations/fees.schema';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildMeta } from '../utils/pagination';
import { generateReceiptNumber, buildReceiptText } from '../utils/receiptGenerator';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, class_id } = req.query;

    let query = supabaseAdmin
      .from('fees')
      .select('*, students(first_name, last_name, roll_number, class_id, classes(name))', { count: 'exact' })
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status)   query = query.eq('status', status as string);
    if (class_id) query = query.eq('students.class_id', class_id as string);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data, meta: buildMeta(page, limit, count ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function listByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .order('academic_year')
      .order('term');

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createFeeSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('fees')
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
    const body = updateFeeSchema.parse(req.body);

    // Fetch current fee to calculate status
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('fees')
      .select('amount_due, receipt_number')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) throw new AppError(404, 'Fee record not found');

    const amountPaid = body.amount_paid;
    const amountDue  = existing.amount_due;

    let status: string;
    let receiptNumber = existing.receipt_number;

    if (amountPaid >= amountDue) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    // Generate receipt number if paid or partial and none exists
    if ((status === 'paid' || status === 'partial') && !receiptNumber) {
      receiptNumber = generateReceiptNumber();
    }

    const { data, error } = await supabaseAdmin
      .from('fees')
      .update({
        amount_paid:    amountPaid,
        paid_date:      body.paid_date ?? (status !== 'unpaid' ? new Date().toISOString().split('T')[0] : null),
        status,
        receipt_number: receiptNumber,
        updated_by:     req.user!.userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('fees')
      .select('*, students(first_name, last_name), users!fees_updated_by_fkey(name)')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Fee record not found');

    if (data.status === 'unpaid') {
      throw new AppError(400, 'Receipt only available for paid or partial payments');
    }

    const receipt = buildReceiptText({
      receiptNumber:  data.receipt_number ?? 'N/A',
      studentName:    `${data.students.first_name} ${data.students.last_name}`,
      studentId:      data.student_id,
      academicYear:   data.academic_year,
      term:           data.term,
      amountDue:      data.amount_due,
      amountPaid:     data.amount_paid,
      paidDate:       data.paid_date ?? '',
      updatedByName:  data.users?.name ?? 'Admin',
    });

    res.json({ success: true, data: { ...data, receiptText: receipt } });
  } catch (err) {
    next(err);
  }
}

export async function summary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('fees')
      .select('status, amount_due, amount_paid');

    if (error) throw new AppError(500, error.message);

    const totalDue    = data.reduce((s, r) => s + Number(r.amount_due), 0);
    const totalPaid   = data.reduce((s, r) => s + Number(r.amount_paid), 0);
    const paidCount   = data.filter(r => r.status === 'paid').length;
    const partialCount = data.filter(r => r.status === 'partial').length;
    const unpaidCount = data.filter(r => r.status === 'unpaid').length;

    res.json({
      success: true,
      data: { totalDue, totalPaid, outstanding: totalDue - totalPaid, paidCount, partialCount, unpaidCount },
    });
  } catch (err) {
    next(err);
  }
}
