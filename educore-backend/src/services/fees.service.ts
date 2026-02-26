/**
 * fees.service.ts
 * Shared helpers for fee calculations and overdue detection.
 */
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';

export type FeeStatus = 'paid' | 'partial' | 'unpaid';

/**
 * Derive fee status from amounts.
 */
export function deriveFeeStatus(amountDue: number, amountPaid: number): FeeStatus {
  if (amountPaid >= amountDue) return 'paid';
  if (amountPaid > 0)          return 'partial';
  return 'unpaid';
}

/**
 * Returns all overdue (unpaid/partial past due_date) fee records.
 */
export async function getOverdueFees() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('fees')
    .select('*, students(first_name, last_name, class_id, classes(name))')
    .in('status', ['unpaid', 'partial'])
    .lt('due_date', today);

  if (error) throw new AppError(500, error.message);
  return data;
}

/**
 * Returns a financial summary for a given academic year.
 */
export async function getYearlySummary(academicYear: string) {
  const { data, error } = await supabaseAdmin
    .from('fees')
    .select('amount_due, amount_paid, status')
    .eq('academic_year', academicYear);

  if (error) throw new AppError(500, error.message);

  return {
    academicYear,
    totalDue:      data.reduce((s, r) => s + Number(r.amount_due),  0),
    totalCollected: data.reduce((s, r) => s + Number(r.amount_paid), 0),
    paidCount:     data.filter(r => r.status === 'paid').length,
    partialCount:  data.filter(r => r.status === 'partial').length,
    unpaidCount:   data.filter(r => r.status === 'unpaid').length,
  };
}
