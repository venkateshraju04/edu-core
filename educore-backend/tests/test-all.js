#!/usr/bin/env node
// ================================================================
// EduCore — Full API Test Suite
// Covers: all endpoints, all roles, role enforcement, real-world
// flows. Run AFTER the server is running on port 3001.
// Usage:  node tests/test-all.js
// ================================================================
'use strict';

const BASE = 'http://localhost:3001';

// ── ANSI colour helpers ──────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  grey:  '\x1b[90m',
  blue:  '\x1b[34m',
  magenta:'\x1b[35m',
};
const pass   = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const fail   = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const info   = (msg) => console.log(`  ${c.grey}→${c.reset} ${msg}`);
const banner = (msg) => console.log(`\n${c.bold}${c.cyan}▶  ${msg}${c.reset}`);
const sub    = (msg) => console.log(`\n  ${c.bold}${c.blue}${msg}${c.reset}`);

// ── State shared across tests ────────────────────────────────────
const tokens   = {};   // { admin, principal, hod, teacher }
const ids      = {};   // created resource IDs reused later

let passed = 0, failed = 0, skipped = 0;

// ── Core request helper ──────────────────────────────────────────
async function req(method, path, { body, token, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, body: json };
  } catch (e) {
    return { status: 0, body: { error: e.message } };
  }
}

// ── Test assertion ───────────────────────────────────────────────
function assert(label, condition, details = '') {
  if (condition) {
    passed++;
    pass(label);
  } else {
    failed++;
    fail(`${label}${details ? `  ${c.grey}(${details})${c.reset}` : ''}`);
  }
}

// ── Seed IDs (from seed.sql) ──────────────────────────────────────
const SEED = {
  dept_math:    '00000000-0000-0000-0000-000000000001',
  dept_science: '00000000-0000-0000-0000-000000000002',
  user_admin:   '00000000-0000-0000-0001-000000000001',
  user_principal:'00000000-0000-0000-0001-000000000002',
  user_hod:     '00000000-0000-0000-0001-000000000003',
  user_teacher: '00000000-0000-0000-0001-000000000004',
  teacher1:     '00000000-0000-0000-0003-000000000001',
  teacher2:     '00000000-0000-0000-0003-000000000002',
  student1:     '00000000-0000-0000-0004-000000000001',
  student2:     '00000000-0000-0000-0004-000000000002',
  class_5a:     '00000000-0000-0000-0002-000000000501',
  class_6a:     '00000000-0000-0000-0002-000000000601',
};

// ═══════════════════════════════════════════════════════════════
// SECTION 0 — Health Check
// ═══════════════════════════════════════════════════════════════
async function testHealth() {
  banner('Health Check');
  const r = await req('GET', '/health');
  assert('GET /health returns 200', r.status === 200, `got ${r.status}`);
  assert('status field is "ok"', r.body?.status === 'ok', JSON.stringify(r.body));
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — Authentication
// ═══════════════════════════════════════════════════════════════
async function testAuth() {
  banner('Authentication');

  sub('1.1 — Login all four roles');
  const roles = [
    { key: 'admin',     email: 'admin@educore.school',     role: 'admin' },
    { key: 'principal', email: 'principal@educore.school', role: 'principal' },
    { key: 'hod',       email: 'hod@educore.school',       role: 'hod' },
    { key: 'teacher',   email: 'teacher@educore.school',   role: 'teacher' },
  ];

  for (const u of roles) {
    const r = await req('POST', '/api/auth/login', {
        body: { email: u.email, password: 'password123', role: u.role },
    });
    assert(`${u.key} login returns 200`, r.status === 200, `got ${r.status}: ${JSON.stringify(r.body)}`);
    if (r.body?.token) {
      tokens[u.key] = r.body.token;
      info(`${u.key} token acquired`);
    } else {
      skipped++;
      info(`${u.key} token missing — downstream tests for this role may fail`);
    }
  }

  sub('1.2 — Wrong password');
  const r1 = await req('POST', '/api/auth/login', {
    body: { email: 'admin@educore.school', password: 'wrongpassword', role: 'admin' },
  });
  assert('Wrong password returns 401', r1.status === 401, `got ${r1.status}`);

  sub('1.3 — Missing token → 401');
  const r2 = await req('GET', '/api/students');
  assert('No token → 401', r2.status === 401, `got ${r2.status}`);

  sub('1.4 — GET /api/auth/me');
  for (const [role, token] of Object.entries(tokens)) {
    const r = await req('GET', '/api/auth/me', { token });
    assert(`GET /me as ${role} returns 200`, r.status === 200, `got ${r.status}`);
    assert(`/me returns correct role (${role})`, r.body?.data?.role === role, `got ${r.body?.data?.role}`);
  }

  sub('1.5 — Logout');
  const rLogout = await req('POST', '/api/auth/logout', { token: tokens.admin });
  assert('POST /logout returns 200', rLogout.status === 200, `got ${rLogout.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — Departments
// ═══════════════════════════════════════════════════════════════
async function testDepartments() {
  banner('Departments');

  sub('2.1 — All roles can list departments');
  for (const role of ['admin', 'principal', 'hod', 'teacher']) {
    const r = await req('GET', '/api/departments', { token: tokens[role] });
    assert(`GET /departments as ${role} → 200`, r.status === 200, `got ${r.status}`);
  }
  const listR = await req('GET', '/api/departments', { token: tokens.admin });
  assert('departments array returned', Array.isArray(listR.body?.data ?? listR.body), JSON.stringify(listR.body).substring(0,80));

  sub('2.2 — Principal assigns HOD to Math dept (idempotent)');
  const r2 = await req('PUT', `/api/departments/${SEED.dept_math}/hod`, {
    token: tokens.principal,
    body:  { hod_user_id: SEED.user_hod },
  });
  assert('PUT /departments/:id/hod as principal → 200|204', [200, 204].includes(r2.status), `got ${r2.status}: ${JSON.stringify(r2.body)}`);

  sub('2.3 — HOD assigns teacher to Math dept');
  const r3 = await req('POST', `/api/departments/${SEED.dept_math}/teachers`, {
    token: tokens.hod,
    body:  { teacher_id: SEED.teacher2, class_id: SEED.class_5a, subject: 'Mathematics' },
  });
  assert('POST /departments/:id/teachers as hod → 200|201', [200, 201].includes(r3.status), `got ${r3.status}: ${JSON.stringify(r3.body)}`);

  sub('2.4 — Role enforcement: teacher cannot assign HOD');
  const r4 = await req('PUT', `/api/departments/${SEED.dept_math}/hod`, {
    token: tokens.teacher,
    body:  { hod_user_id: SEED.user_hod },
  });
  assert('Teacher cannot PUT /departments/:id/hod → 403', r4.status === 403, `got ${r4.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — Students (Admin flow)
// ═══════════════════════════════════════════════════════════════
async function testStudents() {
  banner('Students');

  sub('3.1 — Admin lists all students');
  const rList = await req('GET', '/api/students', { token: tokens.admin });
  assert('GET /students as admin → 200', rList.status === 200, `got ${rList.status}`);

  sub('3.2 — Admin creates a new student');
  const newStudent = {
    roll_number:   99,
    first_name:    'Test',
    last_name:     'Student',
    date_of_birth: '2013-06-15',
    gender:        'male',
    class_id:      SEED.class_5a,
    parent_name:   'Test Parent',
    parent_phone:  '9999999999',
  };
  const rCreate = await req('POST', '/api/students', { token: tokens.admin, body: newStudent });
  assert('POST /students as admin → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.newStudent = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.newStudent) info(`Created student: ${ids.newStudent}`);

  sub('3.3 — Admin updates student');
  if (ids.newStudent) {
    const rUpd = await req('PUT', `/api/students/${ids.newStudent}`, {
      token: tokens.admin,
      body:  { address: '123 Test Street, Chennai' },
    });
    assert('PUT /students/:id as admin → 200', rUpd.status === 200, `got ${rUpd.status}: ${JSON.stringify(rUpd.body)}`);
  } else { skipped++; info('Skipped: no created student id'); }

  sub('3.4 — Admin reads single student');
  const rOne = await req('GET', `/api/students/${SEED.student1}`, { token: tokens.admin });
  assert('GET /students/:id as admin → 200', rOne.status === 200, `got ${rOne.status}`);

  sub('3.5 — Teacher lists their class roster');
  const rClass = await req('GET', `/api/students/class/${SEED.class_5a}`, { token: tokens.teacher });
  assert('GET /students/class/:classId as teacher → 200', rClass.status === 200, `got ${rClass.status}`);

  sub('3.6 — Role enforcement: teacher cannot list ALL students');
  const rForbid = await req('GET', '/api/students', { token: tokens.teacher });
  assert('Teacher GET /students → 403', rForbid.status === 403, `got ${rForbid.status}`);

  sub('3.7 — Validation: missing required field');
  const rBad = await req('POST', '/api/students', {
    token: tokens.admin,
    body:  { first_name: 'Incomplete' },
  });
  assert('POST /students with bad body → 400', rBad.status === 400, `got ${rBad.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — Teachers
// ═══════════════════════════════════════════════════════════════
async function testTeachers() {
  banner('Teachers');

  sub('4.1 — Admin lists teachers');
  const rList = await req('GET', '/api/teachers', { token: tokens.admin });
  assert('GET /teachers as admin → 200', rList.status === 200, `got ${rList.status}`);

  sub('4.2 — Admin creates a new teacher (user + teacher record)');
  // First create a user, then teacher — depends on implementation
  // We'll just test the teacher create endpoint; if it requires user_id, use existing
  const rCreate = await req('POST', '/api/teachers', {
    token: tokens.admin,
    body: {
      name:          'New Teacher',
      email:         `newteacher_${Date.now()}@educore.school`,
      password:      'password123',
      department_id: SEED.dept_science,
      employee_id:   `EMP_${Date.now()}`,
      subjects:      ['Science'],
      qualification: 'M.Sc, B.Ed',
      joining_date:  '2026-01-01',
      phone:         '9898989898',
    },
  });
  assert('POST /teachers as admin → 201|200', [200, 201].includes(rCreate.status), `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.newTeacher = rCreate.body?.data?.id ?? rCreate.body?.id ?? rCreate.body?.teacher?.id;

  sub('4.3 — HOD lists teachers in their department');
  const rDept = await req('GET', `/api/teachers/department/${SEED.dept_math}`, { token: tokens.hod });
  assert('GET /teachers/department/:deptId as hod → 200', rDept.status === 200, `got ${rDept.status}`);

  sub('4.4 — Role enforcement: teacher cannot list all teachers');
  const rForbid = await req('GET', '/api/teachers', { token: tokens.teacher });
  assert('Teacher GET /teachers → 403', rForbid.status === 403, `got ${rForbid.status}`);

  sub('4.5 — HOD reads a single teacher in their dept');
  const rOne = await req('GET', `/api/teachers/${SEED.teacher1}`, { token: tokens.hod });
  assert('GET /teachers/:id as hod → 200', rOne.status === 200, `got ${rOne.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — Admissions (Admin only)
// ═══════════════════════════════════════════════════════════════
async function testAdmissions() {
  banner('Admissions');

  sub('5.1 — Admin lists pending admissions');
  const rList = await req('GET', '/api/admissions', { token: tokens.admin });
  assert('GET /admissions as admin → 200', rList.status === 200, `got ${rList.status}`);

  sub('5.2 — Admin creates new admission');
  const rCreate = await req('POST', '/api/admissions', {
    token: tokens.admin,
    body: {
      first_name:     'Neha',
      last_name:      'Reddy',
      date_of_birth:  '2015-04-10',
      gender:         'female',
      grade_applying: 2,
      parent_name:    'Suresh Reddy',
      parent_phone:   '9111111111',
    },
  });
  assert('POST /admissions as admin → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.admission = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.admission) info(`Created admission: ${ids.admission}`);

  sub('5.3 — Admin approves the admission');
  if (ids.admission) {
    const rApprove = await req('PATCH', `/api/admissions/${ids.admission}/approve`, { token: tokens.admin, body: { class_id: SEED.class_6a } });
    assert('PATCH /admissions/:id/approve → 200', rApprove.status === 200, `got ${rApprove.status}: ${JSON.stringify(rApprove.body)}`);
  } else { skipped++; info('Skipped: no admission id'); }

  sub('5.4 — Admin creates another admission and rejects it');
  const rCreate2 = await req('POST', '/api/admissions', {
    token: tokens.admin,
    body: {
      first_name:     'Raj',
      last_name:      'Kumar',
      date_of_birth:  '2016-08-20',
      gender:         'male',
      grade_applying: 1,
      parent_name:    'Mohan Kumar',
      parent_phone:   '9222222222',
    },
  });
  const admId2 = rCreate2.body?.data?.id ?? rCreate2.body?.id;
  if (admId2) {
    const rReject = await req('PATCH', `/api/admissions/${admId2}/reject`, { token: tokens.admin });
    assert('PATCH /admissions/:id/reject → 200', rReject.status === 200, `got ${rReject.status}: ${JSON.stringify(rReject.body)}`);
  } else {
    skipped++;
    info('Skipped reject: no id from second admission');
  }

  sub('5.5 — Role enforcement: teacher cannot access admissions');
  const rForbid = await req('GET', '/api/admissions', { token: tokens.teacher });
  assert('Teacher GET /admissions → 403', rForbid.status === 403, `got ${rForbid.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6 — Fees (Admin + Principal summary)
// ═══════════════════════════════════════════════════════════════
async function testFees() {
  banner('Fees');

  sub('6.1 — Admin views fee summary');
  const rSum = await req('GET', '/api/fees/summary', { token: tokens.admin });
  assert('GET /fees/summary as admin → 200', rSum.status === 200, `got ${rSum.status}`);

  sub('6.2 — Principal views fee summary');
  const rSumP = await req('GET', '/api/fees/summary', { token: tokens.principal });
  assert('GET /fees/summary as principal → 200', rSumP.status === 200, `got ${rSumP.status}`);

  sub('6.3 — Admin lists all fees');
  const rList = await req('GET', '/api/fees', { token: tokens.admin });
  assert('GET /fees as admin → 200', rList.status === 200, `got ${rList.status}`);

  sub('6.4 — Admin lists fees for a specific student');
  const rSt = await req('GET', `/api/fees/student/${SEED.student1}`, { token: tokens.admin });
  assert('GET /fees/student/:id as admin → 200', rSt.status === 200, `got ${rSt.status}`);

  sub('6.5 — Admin creates a new fee record (Term 2)');
  const rCreate = await req('POST', '/api/fees', {
    token: tokens.admin,
    body: {
      student_id:    SEED.student1,
      academic_year: '2025-26',
      term:          2,
      amount_due:    15000,
      due_date:      '2025-10-31',
    },
  });
  assert('POST /fees as admin → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.feeRecord = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.feeRecord) info(`Created fee record: ${ids.feeRecord}`);

  sub('6.6 — Admin records a partial payment');
  if (ids.feeRecord) {
    const rPay = await req('PUT', `/api/fees/${ids.feeRecord}`, {
      token: tokens.admin,
      body: { amount_paid: 7500, paid_date: '2025-11-05' },
    });
    assert('PUT /fees/:id (partial payment) → 200', rPay.status === 200, `got ${rPay.status}: ${JSON.stringify(rPay.body)}`);
  } else { skipped++; info('Skipped partial payment: no fee id'); }

  sub('6.7 — Admin records full payment');
  if (ids.feeRecord) {
    const rFull = await req('PUT', `/api/fees/${ids.feeRecord}`, {
      token: tokens.admin,
      body: { amount_paid: 15000, paid_date: '2025-11-15' },
    });
    assert('PUT /fees/:id (full payment) → 200', rFull.status === 200, `got ${rFull.status}`);
  } else { skipped++; info('Skipped full payment'); }

  sub('6.8 — Admin downloads receipt');
  if (ids.feeRecord) {
    const rRec = await req('GET', `/api/fees/${ids.feeRecord}/receipt`, { token: tokens.admin });
    assert('GET /fees/:id/receipt → 200', rRec.status === 200, `got ${rRec.status}: ${JSON.stringify(rRec.body).substring(0,60)}`);
  } else { skipped++; info('Skipped receipt: no fee id'); }

  sub('6.9 — Role enforcement: teacher cannot access fees');
  const rForbid = await req('GET', '/api/fees', { token: tokens.teacher });
  assert('Teacher GET /fees → 403', rForbid.status === 403, `got ${rForbid.status}`);

  sub('6.10 — Validation: amount_due missing');
  const rBad = await req('POST', '/api/fees', {
    token: tokens.admin,
    body: { student_id: SEED.student1, academic_year: '2025-26', term: 3 },
  });
  assert('POST /fees missing amount_due → 400', rBad.status === 400, `got ${rBad.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7 — Timetable
// ═══════════════════════════════════════════════════════════════
async function testTimetable() {
  banner('Timetable');

  sub('7.1 — Admin creates a timetable entry');
  const rCreate = await req('POST', '/api/timetable', {
    token: tokens.admin,
    body: {
      class_id:      SEED.class_5a,
      teacher_id:    SEED.teacher1,
      subject:       'Mathematics',
      day_of_week:   'Monday',
      period_number: 1,
      start_time:    '08:00',
      end_time:      '08:45',
    },
  });
  assert('POST /timetable as admin → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.timetable = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.timetable) info(`Created timetable entry: ${ids.timetable}`);

  sub('7.2 — All roles can view timetable');
  for (const role of ['admin', 'principal', 'hod', 'teacher']) {
    const r = await req('GET', `/api/timetable/class/${SEED.class_5a}`, { token: tokens[role] });
    assert(`GET /timetable/class/:id as ${role} → 200`, r.status === 200, `got ${r.status}`);
  }

  sub('7.3 — Admin updates timetable entry');
  if (ids.timetable) {
    const rUpd = await req('PUT', `/api/timetable/${ids.timetable}`, {
      token: tokens.admin,
      body:  { period: 2, start_time: '09:00', end_time: '09:45' },
    });
    assert('PUT /timetable/:id → 200', rUpd.status === 200, `got ${rUpd.status}: ${JSON.stringify(rUpd.body)}`);
  } else { skipped++; info('Skipped timetable update'); }

  sub('7.4 — Role enforcement: teacher cannot create timetable');
  const rForbid = await req('POST', '/api/timetable', {
    token: tokens.teacher,
    body:  { class_id: SEED.class_5a, subject: 'Math', day_of_week: 'Tuesday', period_number: 1 },
  });
  assert('Teacher POST /timetable → 403', rForbid.status === 403, `got ${rForbid.status}`);

  sub('7.5 — Admin deletes timetable entry');
  if (ids.timetable) {
    const rDel = await req('DELETE', `/api/timetable/${ids.timetable}`, { token: tokens.admin });
    assert('DELETE /timetable/:id → 200|204', [200, 204].includes(rDel.status), `got ${rDel.status}`);
  } else { skipped++; info('Skipped timetable delete'); }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 8 — Marks
// ═══════════════════════════════════════════════════════════════
async function testMarks() {
  banner('Marks');

  sub('8.1 — Teacher enters marks (IA1)');
  const rCreate = await req('POST', '/api/marks', {
    token: tokens.teacher,
    body: {
      student_id:     SEED.student1,
      class_id:       SEED.class_5a,
      subject:        'Mathematics',
      exam_type:      'ia1',
      max_marks:      50,
      marks_obtained: 42,
      academic_year:  '2025-26',
    },
  });
  assert('POST /marks as teacher → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.mark = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.mark) info(`Created mark: ${ids.mark}`);

  sub('8.2 — Teacher enters marks (Midterm)');
  const rCreate2 = await req('POST', '/api/marks', {
    token: tokens.teacher,
    body: {
      student_id:     SEED.student2,
      class_id:       SEED.class_5a,
      subject:        'Mathematics',
      exam_type:      'midterm',
      max_marks:      100,
      marks_obtained: 78,
      academic_year:  '2025-26',
    },
  });
  assert('POST /marks midterm → 201', rCreate2.status === 201, `got ${rCreate2.status}`);

  sub('8.3 — Teacher updates marks (correction)');
  if (ids.mark) {
    const rUpd = await req('PUT', `/api/marks/${ids.mark}`, {
      token: tokens.teacher,
      body:  { marks_obtained: 45 },
    });
    assert('PUT /marks/:id as teacher → 200', rUpd.status === 200, `got ${rUpd.status}`);
  } else { skipped++; info('Skipped mark update'); }

  sub('8.4 — HOD views student marks');
  const rHod = await req('GET', `/api/marks/student/${SEED.student1}`, { token: tokens.hod });
  assert('GET /marks/student/:id as hod → 200', rHod.status === 200, `got ${rHod.status}`);

  sub('8.5 — Principal views student marks');
  const rPrin = await req('GET', `/api/marks/student/${SEED.student1}`, { token: tokens.principal });
  assert('GET /marks/student/:id as principal → 200', rPrin.status === 200, `got ${rPrin.status}`);

  sub('8.6 — Validation: marks_obtained > max_marks');
  const rBad = await req('POST', '/api/marks', {
    token: tokens.teacher,
    body: {
      student_id:     SEED.student1,
      class_id:       SEED.class_5a,
      subject:        'Mathematics',
      exam_type:      'ia1',
      max_marks:      50,
      marks_obtained: 60,   // exceeds max
      academic_year:  '2025-26',
    },
  });
  assert('marks_obtained > max_marks → 400', rBad.status === 400, `got ${rBad.status}`);

  sub('8.7 — Role enforcement: admin cannot enter marks');
  const rForbid = await req('POST', '/api/marks', {
    token: tokens.admin,
    body: {
      student_id:     SEED.student1,
      class_id:       SEED.class_5a,
      subject:        'Mathematics',
      exam_type:      'ia2',
      max_marks:      50,
      marks_obtained: 40,
      academic_year:  '2025-26',
    },
  });
  assert('Admin POST /marks → 403', rForbid.status === 403, `got ${rForbid.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 9 — Attendance
// ═══════════════════════════════════════════════════════════════
async function testAttendance() {
  banner('Attendance');

  const today = new Date().toISOString().split('T')[0];

  sub('9.1 — Teacher marks bulk attendance');
  const rBulk = await req('POST', '/api/attendance/bulk', {
    token: tokens.teacher,
    body: {
      class_id: SEED.class_5a,
      date:     today,
      records: [
        { student_id: SEED.student1, is_present: true },
        { student_id: SEED.student2, is_present: false },
        { student_id: '00000000-0000-0000-0004-000000000003', is_present: true },
        { student_id: '00000000-0000-0000-0004-000000000004', is_present: true },
        { student_id: '00000000-0000-0000-0004-000000000005', is_present: false },
      ],
    },
  });
  assert('POST /attendance/bulk as teacher → 200|201', [200, 201].includes(rBulk.status), `got ${rBulk.status}: ${JSON.stringify(rBulk.body)}`);

  sub('9.2 — Teacher reads class attendance for today');
  const rClass = await req('GET', `/api/attendance/class/${SEED.class_5a}/date/${today}`, { token: tokens.teacher });
  assert('GET /attendance/class/:id/date/:date → 200', rClass.status === 200, `got ${rClass.status}`);

  sub('9.3 — HOD views student attendance summary');
  const rHod = await req('GET', `/api/attendance/student/${SEED.student1}`, { token: tokens.hod });
  assert('GET /attendance/student/:id as hod → 200', rHod.status === 200, `got ${rHod.status}`);

  sub('9.4 — Principal views attendance summary');
  const rPrin = await req('GET', `/api/attendance/student/${SEED.student2}`, { token: tokens.principal });
  assert('GET /attendance/student/:id as principal → 200', rPrin.status === 200, `got ${rPrin.status}`);

  sub('9.5 — Role enforcement: admin cannot bulk-mark attendance');
  const rForbid = await req('POST', '/api/attendance/bulk', {
    token: tokens.admin,
    body: { class_id: SEED.class_5a, date: today, records: [] },
  });
  assert('Admin POST /attendance/bulk → 403', rForbid.status === 403, `got ${rForbid.status}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 10 — Lesson Plans
// ═══════════════════════════════════════════════════════════════
async function testLessonPlans() {
  banner('Lesson Plans');

  sub('10.1 — Teacher creates a lesson plan');
  const rCreate = await req('POST', '/api/lesson-plans', {
    token: tokens.teacher,
    body: {
      class_id:   SEED.class_5a,
      subject:    'Mathematics',
      date:       '2026-03-10',
      topic:      'Introduction to Fractions',
      objectives: 'Students will understand basic fraction concepts',
      activities: 'Group activity with fraction manipulatives',
      materials:  'Textbook, fraction tiles',
    },
  });
  assert('POST /lesson-plans as teacher → 201', rCreate.status === 201, `got ${rCreate.status}: ${JSON.stringify(rCreate.body)}`);
  ids.lessonPlan = rCreate.body?.data?.id ?? rCreate.body?.id;
  if (ids.lessonPlan) info(`Created lesson plan: ${ids.lessonPlan}`);

  sub('10.2 — Teacher updates the lesson plan');
  if (ids.lessonPlan) {
    const rUpd = await req('PUT', `/api/lesson-plans/${ids.lessonPlan}`, {
      token: tokens.teacher,
      body:  { objectives: 'Updated: Students will compare and order fractions' },
    });
    assert('PUT /lesson-plans/:id as teacher → 200', rUpd.status === 200, `got ${rUpd.status}`);
  } else { skipped++; info('Skipped lesson plan update'); }

  sub('10.3 — HOD lists lesson plans');
  const rList = await req('GET', '/api/lesson-plans', { token: tokens.hod });
  assert('GET /lesson-plans as hod → 200', rList.status === 200, `got ${rList.status}`);

  sub('10.4 — HOD approves lesson plan');
  if (ids.lessonPlan) {
    const rApprove = await req('PATCH', `/api/lesson-plans/${ids.lessonPlan}/approve`, {
      token: tokens.hod,
    });
    assert('PATCH /lesson-plans/:id/approve as hod → 200', rApprove.status === 200, `got ${rApprove.status}: ${JSON.stringify(rApprove.body)}`);
  } else { skipped++; info('Skipped approval'); }

  sub('10.5 — Teacher creates a second plan for rejection flow');
  const rCreate2 = await req('POST', '/api/lesson-plans', {
    token: tokens.teacher,
    body: {
      class_id:   SEED.class_5a,
      subject:    'Mathematics',
      date:       '2026-03-17',
      topic:      'Decimals — weak plan',
      objectives: 'Decimals',
      activities: 'Worksheet practice',
    },
  });
  const lp2 = rCreate2.body?.data?.id ?? rCreate2.body?.id;

  sub('10.6 — HOD rejects lesson plan');
  if (lp2) {
    const rReject = await req('PATCH', `/api/lesson-plans/${lp2}/reject`, {
      token: tokens.hod,
      body:  { hod_remarks: 'Objectives not specific enough. Please revise.' },
    });
    assert('PATCH /lesson-plans/:id/reject as hod → 200', rReject.status === 200, `got ${rReject.status}`);
  } else { skipped++; info('Skipped rejection'); }

  sub('10.7 — Role enforcement: admin cannot create lesson plan');
  const rForbid = await req('POST', '/api/lesson-plans', {
    token: tokens.admin,
    body:  { class_id: SEED.class_5a, subject: 'Math', date: '2026-03-01', topic: 'Test', objectives: 'Test', activities: 'Test' },
  });
  assert('Admin POST /lesson-plans → 403', rForbid.status === 403, `got ${rForbid.status}`);

  sub('10.8 — Role enforcement: teacher cannot approve lesson plan');
  if (ids.lessonPlan) {
    const rForbid2 = await req('PATCH', `/api/lesson-plans/${ids.lessonPlan}/approve`, { token: tokens.teacher });
    assert('Teacher PATCH /lesson-plans/:id/approve → 403', rForbid2.status === 403, `got ${rForbid2.status}`);
  } else { skipped++; info('Skipped teacher approve guard test'); }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 11 — Notifications
// ═══════════════════════════════════════════════════════════════
async function testNotifications() {
  banner('Notifications');

  sub('11.1 — All roles can list their notifications');
  for (const role of ['admin', 'principal', 'hod', 'teacher']) {
    const r = await req('GET', '/api/notifications', { token: tokens[role] });
    assert(`GET /notifications as ${role} → 200`, r.status === 200, `got ${r.status}`);
  }

  sub('11.2 — Mark notification as read (if any exist)');
  const rList = await req('GET', '/api/notifications', { token: tokens.admin });
  const notes = rList.body?.data ?? rList.body;
  if (Array.isArray(notes) && notes.length > 0) {
    const noteId = notes[0].id;
    const rRead = await req('PATCH', `/api/notifications/${noteId}/read`, { token: tokens.admin });
    assert('PATCH /notifications/:id/read → 200', rRead.status === 200, `got ${rRead.status}`);
  } else {
    skipped++;
    info('No notifications to mark as read (seed data has none)');
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 12 — Cross-role & Edge Cases
// ═══════════════════════════════════════════════════════════════
async function testEdgeCases() {
  banner('Edge Cases & Cross-Role Enforcement');

  sub('12.1 — Invalid token → 401');
  const rInvalid = await req('GET', '/api/students', { token: 'totally.invalid.token' });
  assert('Invalid JWT → 401', rInvalid.status === 401, `got ${rInvalid.status}`);

  sub('12.2 — Non-existent resource → 404');
  const rNotFound = await req('GET', '/api/students/00000000-0000-0000-9999-000000000000', { token: tokens.admin });
  assert('Non-existent student → 404', rNotFound.status === 404, `got ${rNotFound.status}`);

  sub('12.3 — Invalid UUID → 400 or 404');
  const rBadUUID = await req('GET', '/api/students/not-a-uuid', { token: tokens.admin });
  assert('Invalid UUID param → 400 or 422 or 404', [400, 404, 422].includes(rBadUUID.status), `got ${rBadUUID.status}`);

  sub('12.4 — HOD cannot perform admin-only operations');
  const rHodFee = await req('POST', '/api/fees', {
    token: tokens.hod,
    body: { student_id: SEED.student1, academic_year: '2025-26', term: 3, amount_due: 5000, due_date: '2026-01-01' },
  });
  assert('HOD POST /fees → 403', rHodFee.status === 403, `got ${rHodFee.status}`);

  sub('12.5 — Principal cannot mark attendance');
  const rPrinAtt = await req('POST', '/api/attendance/bulk', {
    token: tokens.principal,
    body: { class_id: SEED.class_5a, date: '2026-01-01', records: [] },
  });
  assert('Principal POST /attendance/bulk → 403', rPrinAtt.status === 403, `got ${rPrinAtt.status}`);

  sub('12.6 — Teacher cannot access fee summary');
  const rTeacherFee = await req('GET', '/api/fees/summary', { token: tokens.teacher });
  assert('Teacher GET /fees/summary → 403', rTeacherFee.status === 403, `got ${rTeacherFee.status}`);

  sub('12.7 — Teacher cannot approve admissions');
  const rTeacherAdm = await req('GET', '/api/admissions', { token: tokens.teacher });
  assert('Teacher GET /admissions → 403', rTeacherAdm.status === 403, `got ${rTeacherAdm.status}`);
}

// ═══════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${c.bold}${c.magenta}═══════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}${c.magenta}   EduCore Backend — Full API Test Suite${c.reset}`);
  console.log(`${c.bold}${c.magenta}   Target: ${BASE}${c.reset}`);
  console.log(`${c.bold}${c.magenta}═══════════════════════════════════════════════════${c.reset}`);

  await testHealth();
  await testAuth();
  await testDepartments();
  await testStudents();
  await testTeachers();
  await testAdmissions();
  await testFees();
  await testTimetable();
  await testMarks();
  await testAttendance();
  await testLessonPlans();
  await testNotifications();
  await testEdgeCases();

  // ── Summary ─────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log(`\n${c.bold}${c.magenta}═══════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}  RESULTS${c.reset}`);
  console.log(`  ${c.green}Passed : ${passed}${c.reset}`);
  console.log(`  ${c.red}Failed : ${failed}${c.reset}`);
  console.log(`  ${c.yellow}Skipped: ${skipped}${c.reset}`);
  console.log(`  Total  : ${total}`);
  console.log(`${c.bold}${c.magenta}═══════════════════════════════════════════════════${c.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n${c.red}Fatal error:${c.reset}`, e);
  process.exit(1);
});
