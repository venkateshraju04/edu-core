import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/db';

/* ─── helpers ──────────────────────────────────────────── */

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v) || 0;
}

function currency(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`;
}

/* ─── intent detection ─────────────────────────────────── */

type Intent =
  | 'greet'
  | 'student_count'
  | 'teacher_count'
  | 'fee_summary'
  | 'pending_admissions'
  | 'department_list'
  | 'attendance_overview'
  | 'lesson_plan_status'
  | 'timetable_info'
  | 'student_search'
  | 'teacher_search'
  | 'help'
  | 'unknown';

function detectIntent(message: string): { intent: Intent; params: Record<string, string> } {
  const m = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|yo)\b/.test(m)) {
    return { intent: 'greet', params: {} };
  }

  // Help
  if (/\b(help|what can you|commands|capabilities|what do you)\b/.test(m)) {
    return { intent: 'help', params: {} };
  }

  // Student search
  const studentSearchMatch = m.match(/(?:find|search|look\s*up|who\s+is)\s+student\s+(.+)/);
  if (studentSearchMatch) {
    return { intent: 'student_search', params: { query: studentSearchMatch[1].trim() } };
  }

  // Teacher search
  const teacherSearchMatch = m.match(/(?:find|search|look\s*up|who\s+is)\s+teacher\s+(.+)/);
  if (teacherSearchMatch) {
    return { intent: 'teacher_search', params: { query: teacherSearchMatch[1].trim() } };
  }

  // Student count
  if (/\b(how many|total|count|number of)\b.*\bstudent/i.test(m) || /\bstudent.*(count|total|how many)\b/i.test(m)) {
    return { intent: 'student_count', params: {} };
  }

  // Teacher count
  if (/\b(how many|total|count|number of)\b.*\bteacher/i.test(m) || /\bteacher.*(count|total|how many)\b/i.test(m)) {
    return { intent: 'teacher_count', params: {} };
  }

  // Fee summary
  if (/\b(fee|fees|revenue|payment|collection|financial|finance|money|income|unpaid|outstanding)\b/.test(m)) {
    return { intent: 'fee_summary', params: {} };
  }

  // Pending admissions
  if (/\b(admission|application|pending.*admission|new.*admission)\b/.test(m)) {
    return { intent: 'pending_admissions', params: {} };
  }

  // Department list
  if (/\b(department|dept|hod)\b/.test(m)) {
    return { intent: 'department_list', params: {} };
  }

  // Attendance
  if (/\b(attendance|present|absent)\b/.test(m)) {
    return { intent: 'attendance_overview', params: {} };
  }

  // Lesson plans
  if (/\b(lesson|plan|lesson\s*plan)\b/.test(m)) {
    return { intent: 'lesson_plan_status', params: {} };
  }

  // Timetable
  if (/\b(timetable|schedule|period|class\s*schedule)\b/.test(m)) {
    return { intent: 'timetable_info', params: {} };
  }

  // Student-related (broad)
  if (/\bstudent/.test(m)) {
    return { intent: 'student_count', params: {} };
  }

  // Teacher-related (broad)
  if (/\bteacher/.test(m)) {
    return { intent: 'teacher_count', params: {} };
  }

  return { intent: 'unknown', params: {} };
}

/* ─── intent handlers ──────────────────────────────────── */

async function handleGreet(userName: string): Promise<string> {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${greeting}, ${userName}! 👋 I'm your EduCore assistant. Ask me about students, teachers, fees, admissions, departments, attendance, lesson plans, or timetable. How can I help you today?`;
}

async function handleHelp(): Promise<string> {
  return `Here's what I can help you with:\n\n` +
    `📊 **Dashboard Info** — "How many students do we have?"\n` +
    `👩‍🏫 **Teachers** — "How many teachers?" or "Find teacher Smith"\n` +
    `💰 **Fees** — "Fee summary" or "How much is unpaid?"\n` +
    `📝 **Admissions** — "Pending admissions" or "New applications"\n` +
    `🏢 **Departments** — "List departments" or "Who are the HODs?"\n` +
    `📋 **Attendance** — "Attendance overview"\n` +
    `📖 **Lesson Plans** — "Lesson plan status"\n` +
    `🗓️ **Timetable** — "Timetable info"\n` +
    `🔍 **Search** — "Find student John" or "Search teacher Patel"\n\n` +
    `Just type naturally — I'll understand! 😊`;
}

async function handleStudentCount(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) return `Sorry, I couldn't fetch student data right now. Please try again later.`;

  const total = count ?? 0;

  // Get class distribution
  const { data: classData } = await supabaseAdmin
    .from('students')
    .select('class_id, classes(name)')
    .eq('is_active', true);

  const classCounts: Record<string, number> = {};
  if (classData) {
    for (const s of classData) {
      const className = (s.classes as any)?.name ?? 'Unknown';
      classCounts[className] = (classCounts[className] || 0) + 1;
    }
  }

  let response = `📚 **Total Active Students: ${total}**\n\n`;
  if (Object.keys(classCounts).length > 0) {
    response += `Class-wise breakdown:\n`;
    const sorted = Object.entries(classCounts).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [cls, cnt] of sorted) {
      response += `• ${cls}: ${cnt} students\n`;
    }
  }
  return response;
}

async function handleTeacherCount(): Promise<string> {
  const { data, count, error } = await supabaseAdmin
    .from('teachers')
    .select('*, users(name), departments(name)', { count: 'exact' })
    .eq('is_active', true);

  if (error) return `Sorry, I couldn't fetch teacher data right now.`;

  const total = count ?? data?.length ?? 0;

  const deptCounts: Record<string, number> = {};
  if (data) {
    for (const t of data) {
      const dept = (t.departments as any)?.name ?? 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }
  }

  let response = `👩‍🏫 **Total Active Teachers: ${total}**\n\n`;
  if (Object.keys(deptCounts).length > 0) {
    response += `Department-wise:\n`;
    for (const [dept, cnt] of Object.entries(deptCounts)) {
      response += `• ${dept}: ${cnt} teachers\n`;
    }
  }
  return response;
}

async function handleFeeSummary(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('fees')
    .select('amount_due, amount_paid, status');

  if (error) return `Sorry, I couldn't fetch fee data right now.`;

  const fees = data ?? [];
  const totalDue = fees.reduce((s, f) => s + num(f.amount_due), 0);
  const totalPaid = fees.reduce((s, f) => s + num(f.amount_paid), 0);
  const outstanding = totalDue - totalPaid;
  const paidCount = fees.filter(f => f.status === 'paid').length;
  const partialCount = fees.filter(f => f.status === 'partial').length;
  const unpaidCount = fees.filter(f => f.status === 'unpaid').length;

  return `💰 **Fee Summary**\n\n` +
    `• Total Due: ${currency(totalDue)}\n` +
    `• Total Collected: ${currency(totalPaid)}\n` +
    `• Outstanding: ${currency(outstanding)}\n\n` +
    `**Status Breakdown:**\n` +
    `✅ Paid: ${paidCount} records\n` +
    `⚠️ Partial: ${partialCount} records\n` +
    `❌ Unpaid: ${unpaidCount} records\n\n` +
    `Collection Rate: ${totalDue > 0 ? pct((totalPaid / totalDue) * 100) : '0%'}`;
}

async function handlePendingAdmissions(): Promise<string> {
  const { data, count, error } = await supabaseAdmin
    .from('admissions')
    .select('first_name, last_name, grade_applying, status, created_at', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return `Sorry, I couldn't fetch admission data right now.`;

  const total = count ?? 0;
  let response = `📝 **Pending Admissions: ${total}**\n\n`;

  if (data && data.length > 0) {
    response += `Most recent applications:\n`;
    for (const a of data) {
      response += `• ${a.first_name} ${a.last_name} — Grade ${a.grade_applying}\n`;
    }
    if (total > 5) {
      response += `\n...and ${total - 5} more pending.`;
    }
  } else {
    response += `No pending admissions at the moment! 🎉`;
  }
  return response;
}

async function handleDepartmentList(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('name, hod_id, users(name)')
    .order('name');

  if (error) return `Sorry, I couldn't fetch department data right now.`;

  const departments = data ?? [];
  let response = `🏢 **Departments (${departments.length})**\n\n`;

  for (const dept of departments) {
    const hodName = (dept.users as any)?.name ?? 'Not assigned';
    response += `• **${dept.name}** — HOD: ${hodName}\n`;
  }
  return response;
}

async function handleAttendanceOverview(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('is_present')
    .eq('date', today);

  if (error) return `Sorry, I couldn't fetch attendance data right now.`;

  const records = data ?? [];
  if (records.length === 0) {
    return `📋 **Today's Attendance**\n\nNo attendance has been marked for today yet.`;
  }

  const present = records.filter(r => r.is_present).length;
  const absent = records.length - present;
  const percentage = (present / records.length) * 100;

  return `📋 **Today's Attendance** (${today})\n\n` +
    `• Total marked: ${records.length}\n` +
    `• Present: ${present} ✅\n` +
    `• Absent: ${absent} ❌\n` +
    `• Attendance rate: ${pct(percentage)}`;
}

async function handleLessonPlanStatus(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('lesson_plans')
    .select('status');

  if (error) return `Sorry, I couldn't fetch lesson plan data right now.`;

  const plans = data ?? [];
  const pending = plans.filter(p => p.status === 'pending').length;
  const approved = plans.filter(p => p.status === 'approved').length;
  const rejected = plans.filter(p => p.status === 'rejected').length;

  return `📖 **Lesson Plan Status**\n\n` +
    `• Total Plans: ${plans.length}\n` +
    `• ⏳ Pending: ${pending}\n` +
    `• ✅ Approved: ${approved}\n` +
    `• ❌ Rejected: ${rejected}`;
}

async function handleTimetableInfo(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('timetable')
    .select('*', { count: 'exact', head: true });

  if (error) return `Sorry, I couldn't fetch timetable data right now.`;

  const total = count ?? 0;

  const { data: classData } = await supabaseAdmin
    .from('classes')
    .select('name')
    .order('grade')
    .order('section');

  const totalClasses = classData?.length ?? 0;

  return `🗓️ **Timetable Overview**\n\n` +
    `• Total scheduled slots: ${total}\n` +
    `• Classes configured: ${totalClasses}\n` +
    `• Days: Monday – Friday\n` +
    `• Periods: Up to 8 per day\n\n` +
    `Navigate to the Timetable page for the full schedule.`;
}

async function handleStudentSearch(query: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('first_name, last_name, roll_number, classes(name)')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5);

  if (error) return `Sorry, I couldn't search for students right now.`;

  if (!data || data.length === 0) {
    return `🔍 No students found matching "${query}".`;
  }

  let response = `🔍 **Students matching "${query}":**\n\n`;
  for (const s of data) {
    const className = (s.classes as any)?.name ?? 'Unassigned';
    response += `• ${s.first_name} ${s.last_name} (Roll #${s.roll_number}) — ${className}\n`;
  }
  return response;
}

async function handleTeacherSearch(query: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('teachers')
    .select('employee_id, subjects, users(name, email), departments(name)')
    .eq('is_active', true);

  if (error) return `Sorry, I couldn't search for teachers right now.`;

  const matches = (data ?? []).filter((t) => {
    const name = ((t.users as any)?.name ?? '').toLowerCase();
    return name.includes(query.toLowerCase());
  });

  if (matches.length === 0) {
    return `🔍 No teachers found matching "${query}".`;
  }

  let response = `🔍 **Teachers matching "${query}":**\n\n`;
  for (const t of matches.slice(0, 5)) {
    const name = (t.users as any)?.name ?? 'Unknown';
    const dept = (t.departments as any)?.name ?? 'Unassigned';
    const subjects = Array.isArray(t.subjects) ? t.subjects.join(', ') : String(t.subjects);
    response += `• **${name}** (${t.employee_id}) — ${dept}\n  Subjects: ${subjects}\n`;
  }
  return response;
}

/* ─── main controller ──────────────────────────────────── */

export async function chat(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Message is required.' });
      return;
    }

    const userName = req.user?.name ?? 'User';
    const { intent, params } = detectIntent(message);

    let reply: string;

    switch (intent) {
      case 'greet':
        reply = await handleGreet(userName);
        break;
      case 'help':
        reply = await handleHelp();
        break;
      case 'student_count':
        reply = await handleStudentCount();
        break;
      case 'teacher_count':
        reply = await handleTeacherCount();
        break;
      case 'fee_summary':
        reply = await handleFeeSummary();
        break;
      case 'pending_admissions':
        reply = await handlePendingAdmissions();
        break;
      case 'department_list':
        reply = await handleDepartmentList();
        break;
      case 'attendance_overview':
        reply = await handleAttendanceOverview();
        break;
      case 'lesson_plan_status':
        reply = await handleLessonPlanStatus();
        break;
      case 'timetable_info':
        reply = await handleTimetableInfo();
        break;
      case 'student_search':
        reply = await handleStudentSearch(params.query ?? '');
        break;
      case 'teacher_search':
        reply = await handleTeacherSearch(params.query ?? '');
        break;
      default:
        reply = `I'm not sure I understood that. 🤔\n\nTry asking me about:\n• Students or teachers\n• Fees and payments\n• Admissions\n• Departments\n• Attendance\n• Lesson plans\n• Timetable\n\nOr type **help** to see all available commands!`;
        break;
    }

    res.json({ success: true, data: { reply, intent } });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'An error occurred processing your message.' });
  }
}
