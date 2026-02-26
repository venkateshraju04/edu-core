/**
 * receiptGenerator.ts
 *
 * Generates a human-readable receipt number and a plain-text receipt body.
 * Extend this to produce PDFs (e.g. with pdf-lib or puppeteer) when needed.
 */

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  academicYear: string;
  term: number;
  amountDue: number;
  amountPaid: number;
  paidDate: string;
  updatedByName: string;
}

/**
 * Generate a unique receipt number.
 * Format: RCP-<YEAR>-<RANDOM 6-DIGIT>
 */
export function generateReceiptNumber(): string {
  const year   = new Date().getFullYear();
  const rand   = Math.floor(100000 + Math.random() * 900000);
  return `RCP-${year}-${rand}`;
}

/**
 * Returns a formatted plain-text receipt string.
 */
export function buildReceiptText(data: ReceiptData): string {
  const balance = data.amountDue - data.amountPaid;
  const status  = balance <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT';

  return `
======================================
         EDUCORE SCHOOL
      OFFICIAL FEE RECEIPT
======================================
Receipt No   : ${data.receiptNumber}
Date         : ${data.paidDate}
Academic Year: ${data.academicYear}  |  Term: ${data.term}
--------------------------------------
Student      : ${data.studentName}
Student ID   : ${data.studentId}
--------------------------------------
Amount Due   : ₹${data.amountDue.toFixed(2)}
Amount Paid  : ₹${data.amountPaid.toFixed(2)}
Balance      : ₹${balance.toFixed(2)}
Status       : ${status}
--------------------------------------
Received By  : ${data.updatedByName}
======================================
  `.trim();
}
