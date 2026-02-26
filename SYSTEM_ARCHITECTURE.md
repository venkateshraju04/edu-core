# EduCore – Modern School Administration System
## System Architecture Document

> **Version:** 1.0  
> **Project:** EduCore – Modern School Admin  
> **Date:** February 2026  
> **Design Vibe:** Clean, Professional, SaaS-like

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Design](#6-database-design)
7. [API Endpoints](#7-api-endpoints)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Module Breakdown](#9-module-breakdown)
10. [File & Folder Structure](#10-file--folder-structure)

---

## 1. System Overview

EduCore is a web-based School Management System (SMS) designed for schools with classes from Grade 1 to Grade 10, each split into two sections (A and B). The platform provides role-based dashboards for four distinct user types, enabling administration, class management, fee tracking, academic reporting, and lesson planning in a single unified interface.

### Core Capabilities

| Capability              | Description                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| Role-Based Access       | 4 roles: Admin, Principal, HOD, Teacher — each with scoped permissions      |
| Fee Management         | Track dues, partial payments, receipts (no payment gateway needed)          |
| Academic Management     | Timetable, lesson plans, marks entry for IA-1, IA-2, Midterm, Final, Assignments |
| Student Management     | Admissions, class assignment, performance tracking                          |
| Teacher Management     | Add/edit teachers, assign to departments and classes, evaluate performance  |
| Lesson Plan Workflow   | Teachers submit → HOD approves/rejects                                      |
| Notifications          | Role-specific notification feeds in the header                              |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               React + TypeScript (SPA)                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │  Admin   │  │Principal │  │   HOD    │  │Teacher │  │   │
│  │  │Dashboard │  │Dashboard │  │Dashboard │  │Dashboard│  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│  │                   React Router v6                        │   │
│  │                   Auth Context (useAuth)                 │   │
│  │                   Tailwind CSS                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND SERVER                             │
│                                                                 │
│   Node.js + Express.js                                         │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │Auth      │  │Students  │  │Teachers  │  │Fees         │  │
│   │Middleware│  │API       │  │API       │  │API          │  │
│   └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │Admissions│  │Timetable │  │Lesson    │  │Notifications│  │
│   │API       │  │API       │  │Plans API │  │API          │  │
│   └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                                                                 │
│   JWT Authentication  |  Role-Based Middleware  |  Multer      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                       DATABASE LAYER                            │
│                                                                 │
│   Supabase (PostgreSQL DB)        Supabase Auth (Sessions)     │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │Users     │  │Students  │  │Teachers  │  │Fees         │  │
│   └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│   │Classes   │  │Timetable │  │Lesson    │  │Marks        │  │
│   │Sections  │  │          │  │Plans     │  │             │  │
│   └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Access Control

### Role Overview

| Role          | Access Level         | Primary Goal                                          |
|---------------|----------------------|-------------------------------------------------------|
| **Admin**     | Full Read/Write      | Manage operations, finances, system settings          |
| **Principal** | Mostly Read-Only     | Oversight, performance monitoring, reporting          |
| **HOD**       | Read + Approve       | Department management, lesson plan approval           |
| **Teacher**   | Restricted (own classes) | Classroom management, daily logging               |

### Permission Matrix

| Feature                         | Admin | Principal | HOD | Teacher |
|----------------------------------|:-----:|:---------:|:---:|:-------:|
| View Dashboard                  | ✅    | ✅        | ✅  | ✅      |
| Add/Edit Students               | ✅    | ❌        | ❌  | ❌      |
| View Student Reports            | ✅    | ✅        | ✅  | ✅ (own)|
| Approve Admissions              | ✅    | ❌        | ❌  | ❌      |
| Add/Edit Teachers               | ✅    | ❌        | ❌  | ❌      |
| Evaluate Teachers               | ❌    | ✅        | ❌  | ❌      |
| Fee Management (Full)           | ✅    | ❌        | ❌  | ❌      |
| Fee Summary (View Only)         | ❌    | ✅        | ❌  | ❌      |
| Timetable Edit                  | ✅    | ❌        | ❌  | ❌      |
| Timetable View                  | ✅    | ✅        | ✅  | ✅      |
| Assign HODs to Departments      | ❌    | ✅        | ❌  | ❌      |
| Assign Teachers to Classes      | ❌    | ❌        | ✅  | ❌      |
| Create Lesson Plans             | ❌    | ❌        | ❌  | ✅      |
| Approve/Reject Lesson Plans     | ❌    | ❌        | ✅  | ❌      |
| Mark Attendance / Grades        | ❌    | ❌        | ❌  | ✅ (own)|
| System Settings                 | ✅    | ❌        | ❌  | ❌      |

### Sidebar Navigation per Role

**Admin Sidebar:**
- Dashboard
- Fees
- Admissions
- All Students
- All Teachers
- Timetable
- Settings

**Principal Sidebar:**
- Dashboard
- Teacher Evaluations
- Student Reports
- Department Management
- Attendance Overview

**HOD Sidebar:**
- Dashboard
- My Department
- Teacher Assignment
- Lesson Plans (Approval)
- Student Reports

**Teacher Sidebar:**
- Dashboard
- My Classes
- Student Marking
- Lesson Plans
- My Profile

---

## 4. Frontend Architecture

### Tech Stack

| Tool/Library        | Version      | Purpose                                      |
|---------------------|--------------|----------------------------------------------|
| React               | 18+          | UI component framework                       |
| TypeScript          | 5+           | Type safety                                  |
| React Router        | v6           | Client-side routing / SPA navigation         |
| Tailwind CSS        | 3+           | Utility-first styling                        |
| Lucide React        | Latest       | Icons (GraduationCap, Bell, User, etc.)      |
| Vite                | 5+           | Build tool and dev server                    |

### Application State Management

- **Auth Context** (`useAuth`) — global context storing the logged-in user's role, name, department, and profile data; wraps the entire app in `App.tsx`
- **Component-level state** — each component manages its own local state using `useState` (filters, modal open/close, selected class/student, form values)
- No external state manager (Redux/Zustand) required for this scope

### Routing Structure

```
/                        → Redirect to /login
/login                   → Login.tsx

/admin/dashboard         → admin/AdminDashboard.tsx
/admin/fees              → admin/FeesManagement.tsx
/admin/admissions        → admin/Admissions.tsx
/admin/students          → admin/StudentManagement.tsx
/admin/teachers          → admin/TeacherManagement.tsx
/admin/timetable         → Timetable.tsx
/admin/settings          → admin/Settings.tsx

/principal/dashboard     → principal/PrincipalDashboard.tsx
/principal/evaluations   → principal/TeacherEvaluation.tsx
/principal/departments   → principal/DepartmentManagement.tsx
/principal/students      → StudentPerformance.tsx
/principal/teachers      → TeacherPerformance.tsx

/hod/dashboard           → hod/HodDashboard.tsx
/hod/teachers            → hod/TeacherAssignment.tsx
/hod/lessons             → teacher/LessonPlans.tsx  (HOD approval view)
/hod/students            → StudentPerformance.tsx   (view-only)

/teacher/dashboard       → teacher/TeacherDashboard.tsx
/teacher/classes         → teacher/MyClasses.tsx
/teacher/marking         → teacher/StudentMarking.tsx
/teacher/lessons         → teacher/LessonPlans.tsx
```

### Component Architecture

```
src/
├── App.tsx                          # Root: AuthContext, Router setup, role-based routing
├── styles/
│   └── globals.css                  # Global Tailwind base styles
└── components/
    ├── Login.tsx                    # Login card, role dropdown, credential check
    ├── Sidebar.tsx                  # Dynamic sidebar (renders based on useAuth role)
    ├── Header.tsx                   # Top bar: notifications (role-specific), profile dropdown
    ├── StudentPerformance.tsx       # Class → Student drill-down, progress bar attendance
    ├── TeacherPerformance.tsx       # Teacher profile cards with rating
    ├── Timetable.tsx                # CSS Grid timetable; class selector; edit mode
    ├── admin/
    │   ├── AdminDashboard.tsx       # Stat cards: students, fees, teachers, alerts
    │   ├── FeesManagement.tsx       # Fee table, filters, print(paid/partial only), update fee
    │   ├── Admissions.tsx           # Admission list, New Admission modal form
    │   ├── StudentManagement.tsx    # Students by class, add to class from admissions
    │   ├── TeacherManagement.tsx    # Add/edit teacher profiles (no performance review)
    │   └── Settings.tsx             # System info, training docs (no contact support)
    ├── principal/
    │   ├── PrincipalDashboard.tsx   # School-wide KPIs, view-only stats
    │   ├── TeacherEvaluation.tsx    # Star rating + feedback form (write for evaluations only)
    │   └── DepartmentManagement.tsx # Assign HODs to departments, assign teachers
    ├── hod/
    │   ├── HodDashboard.tsx         # Dept overview, pending lesson plans widget
    │   └── TeacherAssignment.tsx    # Assign teachers to specific classes
    └── teacher/
        ├── TeacherDashboard.tsx     # Personal KPIs, upcoming class, pending plans
        ├── MyClasses.tsx            # Class list (attendance view only, no grade entry)
        ├── StudentMarking.tsx       # Select class → student; update attendance (progress bar,
        │                            # read-only), behaviour, IA-1, IA-2, Midterm, Final,
        │                            # unlimited assignments (Update buttons per card)
        └── LessonPlans.tsx          # Submit lesson plan; HOD approval status; View Details modal
```

### UI Design System

| Element             | Design Decision                                                    |
|---------------------|--------------------------------------------------------------------|
| Card Style          | White background, rounded corners (`rounded-xl`), soft shadow      |
| Page Background     | Light grey (`bg-gray-100` / `#f3f4f6`)                             |
| Sidebar             | Dark blue / dark grey with white text and icons                    |
| Header              | White background with light shadow                                 |
| Primary Button      | Blue (`bg-blue-600`) with white text                               |
| Status Pills        | Green = Paid, Yellow = Partial, Red = Unpaid / Overdue             |
| Attendance          | Progress bar (green ≥90%, yellow 75–89%, red <75%)                 |
| Typography          | System sans-serif, clear hierarchy                                 |
| Input Labels        | Floating labels (text moves up on focus)                           |
| Timetable           | CSS Grid (rows = time slots, columns = Mon–Fri)                    |
| Modals              | White overlay centered on blurred backdrop                         |

### Classes & Sections

Grades **1 through 10**, each with two sections:
- Grade 1-A, Grade 1-B
- Grade 2-A, Grade 2-B
- ... through ...
- Grade 10-A, Grade 10-B

**Subjects by Grade Band:**

| Grade Band    | Subjects                                                         |
|---------------|------------------------------------------------------------------|
| Grades 1–5    | English, Mathematics, Science, Social Studies, Hindi, Art & Craft|
| Grades 6–8    | English, Mathematics, Science, Social Science, Hindi, Computer   |
| Grades 9–10   | English, Mathematics, Science, Social Science, Hindi, Computer, Physical Education |

---

## 5. Backend Architecture

### Recommended Tech Stack

| Layer             | Technology                   | Reason                                          |
|-------------------|------------------------------|-------------------------------------------------|
| Runtime           | Node.js 20 LTS               | Non-blocking I/O, large ecosystem               |
| Framework         | Express.js                   | Lightweight, flexible REST API                  |
| Authentication    | Supabase Auth                | Built-in JWT, session management, role metadata |
| DB / Client       | Supabase + @supabase/supabase-js | Managed PostgreSQL, auto-generated REST API |
| Auth Sessions     | Supabase Auth (built-in)     | Token management, refresh tokens, RLS policies  |
| File Uploads      | Multer                       | Teacher/student profile photos                  |
| Validation        | Zod                          | Request body validation with TypeScript types   |
| Email (optional)  | Nodemailer                   | Fee due alerts, admission confirmations         |

### Middleware Pipeline

```
Request
   │
   ▼
Express Router
   │
   ├─► corsMiddleware          — Allow frontend origin
   │
   ├─► helmetMiddleware        — Security headers
   │
   ├─► rateLimiter             — Prevent brute force
   │
   ├─► jwtAuthMiddleware       — Verify JWT; attach user to req.user
   │
   ├─► roleGuard(roles[])      — Check req.user.role is in allowed list
   │
   └─► routeHandler            — Business logic
              │
              ▼
           Response
```

### Server Folder Structure (Proposed)

```
backend/
├── src/
│   ├── server.ts                  # Express app entry point
│   ├── config/
│   │   ├── db.ts                  # Supabase client singleton
│   │   └── env.ts                 # Environment variable validation
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification middleware
│   │   ├── roleGuard.ts           # Role-based access guard factory
│   │   └── errorHandler.ts        # Centralised error handling
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── students.routes.ts
│   │   ├── teachers.routes.ts
│   │   ├── fees.routes.ts
│   │   ├── admissions.routes.ts
│   │   ├── timetable.routes.ts
│   │   ├── lessonPlans.routes.ts
│   │   ├── departments.routes.ts
│   │   └── notifications.routes.ts
│   ├── controllers/               # Route handler functions
│   ├── services/                  # Business logic layer
│   ├── validations/               # Zod schemas for request bodies
│   └── utils/
│       └── pagination.ts
├── supabase/
│   ├── migrations/                # SQL migration files
│   └── seed.sql                   # Seed dummy data
├── .env
└── package.json
```

---

## 6. Database Design

### Entity Relationship Overview

```
Users ─────────────────────────────┐
  │ (role: admin/principal/hod/    │
  │  teacher)                      │
  │                                │
  ├── Teachers ─────── Departments │
  │       │                │       │
  │       └── ClassTeacher │       │
  │               │        │       │
Students ── Classes ←──────┘       │
    │          │                   │
    ├── Fees   └── Timetable       │
    │                              │
    ├── Marks                      │
    │     ├── ExamMarks            │
    │     └── AssignmentMarks      │
    │                              │
    └── Attendance                 │
                                   │
LessonPlans ── Teachers            │
    │                              │
    └── HODApprovals ── HOD(User) ──┘

Admissions (pending → approved → Student)
Notifications → Users
```

---

### Table Definitions

#### `users`

| Column         | Type          | Constraints                          | Notes                      |
|----------------|---------------|--------------------------------------|----------------------------|
| id             | UUID          | PK, default uuid_generate_v4()       |                            |
| name           | VARCHAR(100)  | NOT NULL                             |                            |
| email          | VARCHAR(150)  | UNIQUE, NOT NULL                     |                            |
| password_hash  | VARCHAR(255)  | NOT NULL                             | bcrypt hashed              |
| role           | ENUM          | NOT NULL                             | admin, principal, hod, teacher |
| department_id  | UUID          | FK → departments.id, NULLABLE        | For HOD and Teacher        |
| profile_photo  | VARCHAR(255)  | NULLABLE                             | Storage path/URL           |
| is_active      | BOOLEAN       | DEFAULT true                         |                            |
| created_at     | TIMESTAMP     | DEFAULT NOW()                        |                            |
| updated_at     | TIMESTAMP     | DEFAULT NOW()                        |                            |

---

#### `departments`

| Column         | Type         | Constraints         | Notes                          |
|----------------|--------------|---------------------|--------------------------------|
| id             | UUID         | PK                  |                                |
| name           | VARCHAR(100) | UNIQUE, NOT NULL    | e.g., "Science", "Mathematics" |
| hod_id         | UUID         | FK → users.id, NULLABLE | Set by Principal          |
| created_at     | TIMESTAMP    | DEFAULT NOW()       |                                |

---

#### `classes`

| Column      | Type        | Constraints         | Notes                        |
|-------------|-------------|---------------------|------------------------------|
| id          | UUID        | PK                  |                              |
| grade       | INT         | NOT NULL            | 1–10                         |
| section     | CHAR(1)     | NOT NULL            | 'A' or 'B'                   |
| name        | VARCHAR(20) | GENERATED / NOT NULL| e.g., "Grade 5-A"            |
| capacity    | INT         | DEFAULT 40          |                              |

**Unique constraint:** `(grade, section)`

---

#### `students`

| Column           | Type         | Constraints              | Notes                        |
|------------------|--------------|--------------------------|------------------------------|
| id               | UUID         | PK                       |                              |
| roll_number      | INT          | NOT NULL                 | Within class                 |
| first_name       | VARCHAR(100) | NOT NULL                 |                              |
| last_name        | VARCHAR(100) | NOT NULL                 |                              |
| date_of_birth    | DATE         | NOT NULL                 |                              |
| gender           | ENUM         | NOT NULL                 | male, female, other          |
| class_id         | UUID         | FK → classes.id          |                              |
| parent_name      | VARCHAR(150) | NOT NULL                 |                              |
| parent_email     | VARCHAR(150) | NULLABLE                 |                              |
| parent_phone     | VARCHAR(20)  | NOT NULL                 |                              |
| address          | TEXT         | NULLABLE                 |                              |
| previous_school  | VARCHAR(200) | NULLABLE                 |                              |
| profile_photo    | VARCHAR(255) | NULLABLE                 |                              |
| is_active        | BOOLEAN      | DEFAULT true             |                              |
| created_at       | TIMESTAMP    | DEFAULT NOW()            |                              |

---

#### `admissions`

| Column          | Type         | Constraints              | Notes                             |
|-----------------|--------------|--------------------------|-----------------------------------|
| id              | UUID         | PK                       |                                   |
| first_name      | VARCHAR(100) | NOT NULL                 |                                   |
| last_name       | VARCHAR(100) | NOT NULL                 |                                   |
| date_of_birth   | DATE         | NOT NULL                 |                                   |
| gender          | ENUM         | NOT NULL                 |                                   |
| grade_applying  | INT          | NOT NULL                 | Desired grade                     |
| parent_name     | VARCHAR(150) | NOT NULL                 |                                   |
| parent_email    | VARCHAR(150) | NULLABLE                 |                                   |
| parent_phone    | VARCHAR(20)  | NOT NULL                 |                                   |
| address         | TEXT         | NULLABLE                 |                                   |
| previous_school | VARCHAR(200) | NULLABLE                 |                                   |
| status          | ENUM         | DEFAULT 'pending'        | pending, approved, rejected       |
| reviewed_by     | UUID         | FK → users.id, NULLABLE  | Admin who approved/rejected       |
| reviewed_at     | TIMESTAMP    | NULLABLE                 |                                   |
| created_at      | TIMESTAMP    | DEFAULT NOW()            |                                   |

---

#### `teachers`

| Column          | Type         | Constraints             | Notes                            |
|-----------------|--------------|-------------------------|----------------------------------|
| id              | UUID         | PK                      |                                  |
| user_id         | UUID         | FK → users.id, UNIQUE   | Links to auth account            |
| employee_id     | VARCHAR(20)  | UNIQUE, NOT NULL        |                                  |
| department_id   | UUID         | FK → departments.id     |                                  |
| subjects        | TEXT[]       | NOT NULL                | Array of subject names           |
| qualification   | VARCHAR(200) | NULLABLE                |                                  |
| joining_date    | DATE         | NOT NULL                |                                  |
| phone           | VARCHAR(20)  | NULLABLE                |                                  |
| is_active       | BOOLEAN      | DEFAULT true            |                                  |

---

#### `class_teachers` (junction: teacher ↔ class)

| Column     | Type  | Constraints                     |
|------------|-------|---------------------------------|
| id         | UUID  | PK                              |
| teacher_id | UUID  | FK → teachers.id                |
| class_id   | UUID  | FK → classes.id                 |
| subject    | VARCHAR(100) | NOT NULL                 |
| assigned_by | UUID | FK → users.id (HOD)            |
| assigned_at | TIMESTAMP | DEFAULT NOW()             |

**Unique constraint:** `(teacher_id, class_id, subject)`

---

#### `fees`

| Column          | Type         | Constraints              | Notes                            |
|-----------------|--------------|--------------------------|----------------------------------|
| id              | UUID         | PK                       |                                  |
| student_id      | UUID         | FK → students.id         |                                  |
| academic_year   | VARCHAR(10)  | NOT NULL                 | e.g., "2025-26"                  |
| term            | INT          | NOT NULL                 | 1, 2, or 3                       |
| amount_due      | DECIMAL(10,2)| NOT NULL                 |                                  |
| amount_paid     | DECIMAL(10,2)| DEFAULT 0                |                                  |
| due_date        | DATE         | NOT NULL                 |                                  |
| paid_date       | DATE         | NULLABLE                 |                                  |
| status          | ENUM         | DEFAULT 'unpaid'         | paid, partial, unpaid            |
| receipt_number  | VARCHAR(50)  | UNIQUE, NULLABLE         | Generated on payment             |
| updated_by      | UUID         | FK → users.id            | Admin who last updated           |
| created_at      | TIMESTAMP    | DEFAULT NOW()            |                                  |
| updated_at      | TIMESTAMP    | DEFAULT NOW()            |                                  |

---

#### `timetable`

| Column        | Type        | Constraints              | Notes                      |
|---------------|-------------|--------------------------|----------------------------|
| id            | UUID        | PK                       |                            |
| class_id      | UUID        | FK → classes.id          |                            |
| day_of_week   | ENUM        | NOT NULL                 | Monday–Friday              |
| period_number | INT         | NOT NULL                 | 1–8                        |
| start_time    | TIME        | NOT NULL                 | e.g., 08:00                |
| end_time      | TIME        | NOT NULL                 | e.g., 08:45                |
| subject       | VARCHAR(100)| NOT NULL                 |                            |
| teacher_id    | UUID        | FK → teachers.id, NULLABLE|                           |
| room          | VARCHAR(50) | NULLABLE                 | e.g., "Rm 101"             |
| updated_by    | UUID        | FK → users.id            | Admin who last edited      |
| updated_at    | TIMESTAMP   | DEFAULT NOW()            |                            |

**Unique constraint:** `(class_id, day_of_week, period_number)`

---

#### `lesson_plans`

| Column          | Type         | Constraints             | Notes                              |
|-----------------|--------------|-------------------------|------------------------------------|
| id              | UUID         | PK                      |                                    |
| teacher_id      | UUID         | FK → teachers.id        |                                    |
| class_id        | UUID         | FK → classes.id         |                                    |
| subject         | VARCHAR(100) | NOT NULL                |                                    |
| date            | DATE         | NOT NULL                |                                    |
| topic           | VARCHAR(200) | NOT NULL                |                                    |
| objectives      | TEXT         | NOT NULL                |                                    |
| materials       | TEXT         | NULLABLE                |                                    |
| activities      | TEXT         | NOT NULL                |                                    |
| assessment      | TEXT         | NULLABLE                |                                    |
| status          | ENUM         | DEFAULT 'pending'       | pending, approved, rejected        |
| reviewed_by     | UUID         | FK → users.id, NULLABLE | HOD who reviewed                   |
| reviewed_at     | TIMESTAMP    | NULLABLE                |                                    |
| hod_remarks     | TEXT         | NULLABLE                |                                    |
| created_at      | TIMESTAMP    | DEFAULT NOW()           |                                    |
| updated_at      | TIMESTAMP    | DEFAULT NOW()           |                                    |

---

#### `attendance`

| Column      | Type      | Constraints              | Notes                  |
|-------------|-----------|--------------------------|------------------------|
| id          | UUID      | PK                       |                        |
| student_id  | UUID      | FK → students.id         |                        |
| class_id    | UUID      | FK → classes.id          |                        |
| date        | DATE      | NOT NULL                 |                        |
| is_present  | BOOLEAN   | NOT NULL                 |                        |
| marked_by   | UUID      | FK → users.id            | Teacher who marked     |
| created_at  | TIMESTAMP | DEFAULT NOW()            |                        |

**Unique constraint:** `(student_id, class_id, date)`

---

#### `marks`

| Column      | Type         | Constraints             | Notes                                       |
|-------------|--------------|-------------------------|---------------------------------------------|
| id          | UUID         | PK                      |                                             |
| student_id  | UUID         | FK → students.id        |                                             |
| class_id    | UUID         | FK → classes.id         |                                             |
| subject     | VARCHAR(100) | NOT NULL                |                                             |
| exam_type   | ENUM         | NOT NULL                | ia1, midterm, ia2, final_exam, assignment   |
| assignment_no| INT         | NULLABLE                | For assignments only (1, 2, 3, ...)         |
| max_marks   | DECIMAL(5,2) | NOT NULL                |                                             |
| marks_obtained| DECIMAL(5,2)| NOT NULL               |                                             |
| academic_year| VARCHAR(10) | NOT NULL                | e.g., "2025-26"                             |
| entered_by  | UUID         | FK → users.id           | Teacher                                     |
| updated_at  | TIMESTAMP    | DEFAULT NOW()           |                                             |

---

#### `behavior_records`

| Column       | Type         | Constraints       | Notes                  |
|--------------|--------------|-------------------|------------------------|
| id           | UUID         | PK                |                        |
| student_id   | UUID         | FK → students.id  |                        |
| class_id     | UUID         | FK → classes.id   |                        |
| recorded_by  | UUID         | FK → users.id     | Teacher                |
| description  | TEXT         | NOT NULL          | e.g., "Late to class"  |
| recorded_at  | TIMESTAMP    | DEFAULT NOW()     |                        |

---

#### `teacher_evaluations`

| Column        | Type       | Constraints              | Notes                             |
|---------------|------------|--------------------------|-----------------------------------|
| id            | UUID       | PK                       |                                   |
| teacher_id    | UUID       | FK → teachers.id         |                                   |
| evaluated_by  | UUID       | FK → users.id            | Principal                         |
| rating        | DECIMAL(3,1)| NOT NULL, CHECK 0–5     |                                   |
| feedback      | TEXT       | NOT NULL                 |                                   |
| academic_year | VARCHAR(10)| NOT NULL                 |                                   |
| evaluated_at  | TIMESTAMP  | DEFAULT NOW()            |                                   |

---

#### `notifications`

| Column      | Type         | Constraints        | Notes                                    |
|-------------|--------------|--------------------|------------------------------------------|
| id          | UUID         | PK                 |                                          |
| user_id     | UUID         | FK → users.id      | Recipient                                |
| role_target | ENUM[]       | NULLABLE           | Broadcast to role(s) instead of one user |
| title       | VARCHAR(200) | NOT NULL           |                                          |
| body        | TEXT         | NOT NULL           |                                          |
| type        | VARCHAR(50)  | NOT NULL           | fee_due, new_admission, lesson_pending…  |
| is_read     | BOOLEAN      | DEFAULT false      |                                          |
| created_at  | TIMESTAMP    | DEFAULT NOW()      |                                          |

---

## 7. API Endpoints

### Authentication

| Method | Endpoint              | Access  | Description                  |
|--------|-----------------------|---------|------------------------------|
| POST   | `/api/auth/login`     | Public  | Login, returns JWT           |
| POST   | `/api/auth/logout`    | Auth    | Invalidate token (Supabase Auth) |
| GET    | `/api/auth/me`        | Auth    | Get current user profile     |

### Students

| Method | Endpoint                                   | Access             | Description                            |
|--------|--------------------------------------------|--------------------|----------------------------------------|
| GET    | `/api/students`                            | Admin, Principal, HOD | List all students (filterable by class)|
| GET    | `/api/students/:id`                        | Admin, Principal, HOD, Teacher | Student detail        |
| POST   | `/api/students`                            | Admin              | Create student from approved admission |
| PUT    | `/api/students/:id`                        | Admin              | Update student details                 |
| GET    | `/api/students/class/:classId`             | Admin, HOD, Teacher| Students in a specific class           |

### Admissions

| Method | Endpoint                          | Access | Description                   |
|--------|-----------------------------------|--------|-------------------------------|
| GET    | `/api/admissions`                 | Admin  | List all admissions           |
| POST   | `/api/admissions`                 | Admin  | Create new admission request  |
| PATCH  | `/api/admissions/:id/approve`     | Admin  | Approve and promote to student|
| PATCH  | `/api/admissions/:id/reject`      | Admin  | Reject admission              |

### Teachers

| Method | Endpoint                                | Access             | Description                    |
|--------|-----------------------------------------|--------------------|--------------------------------|
| GET    | `/api/teachers`                         | Admin, Principal, HOD | List all teachers           |
| GET    | `/api/teachers/:id`                     | Admin, Principal, HOD | Teacher detail              |
| POST   | `/api/teachers`                         | Admin              | Add new teacher                |
| PUT    | `/api/teachers/:id`                     | Admin              | Edit teacher details           |
| GET    | `/api/teachers/department/:deptId`      | Principal, HOD     | Teachers in a department       |

### Fees

| Method | Endpoint                              | Access | Description                    |
|--------|---------------------------------------|--------|--------------------------------|
| GET    | `/api/fees`                           | Admin  | List all fees (filterable)     |
| GET    | `/api/fees/student/:studentId`        | Admin  | Fees for a specific student    |
| POST   | `/api/fees`                           | Admin  | Create fee record              |
| PUT    | `/api/fees/:id`                       | Admin  | Update fee / payment amount    |
| GET    | `/api/fees/:id/receipt`               | Admin  | Generate receipt (paid/partial)|
| GET    | `/api/fees/summary`                   | Admin, Principal | Financial summary        |

### Timetable

| Method | Endpoint                              | Access       | Description                  |
|--------|---------------------------------------|--------------|------------------------------|
| GET    | `/api/timetable/class/:classId`       | All          | Timetable for a class        |
| POST   | `/api/timetable`                      | Admin        | Create slot                  |
| PUT    | `/api/timetable/:id`                  | Admin        | Edit slot                    |
| DELETE | `/api/timetable/:id`                  | Admin        | Delete slot                  |

### Lesson Plans

| Method | Endpoint                               | Access     | Description                       |
|--------|----------------------------------------|------------|-----------------------------------|
| GET    | `/api/lesson-plans`                    | Teacher (own), HOD, Principal | List plans     |
| GET    | `/api/lesson-plans/:id`                | Owner, HOD | Plan detail                       |
| POST   | `/api/lesson-plans`                    | Teacher    | Submit new lesson plan            |
| PUT    | `/api/lesson-plans/:id`                | Teacher    | Edit pending plan                 |
| PATCH  | `/api/lesson-plans/:id/approve`        | HOD        | Approve lesson plan               |
| PATCH  | `/api/lesson-plans/:id/reject`         | HOD        | Reject with remarks               |

### Attendance

| Method | Endpoint                                       | Access  | Description                    |
|--------|------------------------------------------------|---------|--------------------------------|
| GET    | `/api/attendance/student/:studentId`           | Teacher, HOD, Principal | Student attendance summary |
| GET    | `/api/attendance/class/:classId/date/:date`    | Teacher | Attendance for a class/day     |
| POST   | `/api/attendance/bulk`                         | Teacher | Bulk mark attendance           |

### Marks

| Method | Endpoint                                         | Access  | Description                    |
|--------|--------------------------------------------------|---------|--------------------------------|
| GET    | `/api/marks/student/:studentId`                  | Teacher, HOD, Principal | All marks for a student  |
| POST   | `/api/marks`                                     | Teacher | Enter/update marks             |
| PUT    | `/api/marks/:id`                                 | Teacher | Update a mark entry            |

### Departments

| Method | Endpoint                              | Access     | Description               |
|--------|---------------------------------------|------------|---------------------------|
| GET    | `/api/departments`                    | All        | List departments          |
| PUT    | `/api/departments/:id/hod`            | Principal  | Assign HOD to department  |
| POST   | `/api/departments/:id/teachers`       | HOD        | Assign teacher to class   |

### Notifications

| Method | Endpoint                         | Access | Description                  |
|--------|----------------------------------|--------|------------------------------|
| GET    | `/api/notifications`             | Auth   | Get notifications for user   |
| PATCH  | `/api/notifications/:id/read`    | Auth   | Mark notification as read    |

---

## 8. Authentication & Authorization

### Login Flow

```
1. User submits { email, password }
2. Supabase Auth validates credentials and returns session (access_token + refresh_token)
3. Server reads app_metadata.role from the Supabase JWT claims
4. Client stores session via Supabase JS client (auto-managed)
5. Every request includes Authorization: Bearer <supabase_access_token>
6. jwtAuthMiddleware verifies token with Supabase Auth; sets req.user
7. roleGuard middleware checks req.user.role is in allowed roles array
```

### JWT Payload Structure

```json
{
  "userId": "uuid",
  "name": "Jane Smith",
  "role": "teacher",
  "departmentId": "uuid | null",
  "classIds": ["uuid", "uuid"],
  "iat": 1700000000,
  "exp": 1700028800
}
```

### Guard Examples (Express)

```typescript
// Only Admin can create students
router.post('/students',
  jwtAuth,
  roleGuard(['admin']),
  studentsController.create
);

// Admin, Principal, HOD can view teachers
router.get('/teachers',
  jwtAuth,
  roleGuard(['admin', 'principal', 'hod']),
  teachersController.list
);

// HOD can only approve lesson plans in their department
router.patch('/lesson-plans/:id/approve',
  jwtAuth,
  roleGuard(['hod']),
  departmentScopeGuard,       // Extra guard: checks plan is in HOD's dept
  lessonPlansController.approve
);
```

---

## 9. Module Breakdown

### Module 1: Authentication
- Login page with role selection dropdown
- Supabase Auth (email + password); role stored in `app_metadata`
- Role-based routing (redirect to role-specific home)
- Dummy credentials for prototype; Supabase handles password hashing

### Module 2: Dashboard (per role)
- **Admin:** Total students, fees collected, teachers present, pending alerts, recent updates feed
- **Principal:** School attendance %, average grades, teacher count, dept performance
- **HOD:** Department overview, pending lesson plan approvals count
- **Teacher:** My student attendance %, upcoming class, pending lesson plans

### Module 3: Fees Management (Admin only)
- Table with columns: Student ID, Name, Class, Amount Due, Status (pill)
- Filters: by class, by payment status
- "Due Alerts" banner (red) at top for overdue students
- Update fees button (edit amount)
- Print receipt button (only for Paid / Partial status)
- Receipt modal: clean white overlay with formatted details

### Module 4: Student Management & Performance
- **Admin:** Add students from approved admissions list, assign to class
- **All roles:** Drill-down view: Select Class → Student list appears → Select student → Full profile shown; default shows Roll No. 1 student on class selection
- Performance view: Progress bar attendance, Subject cards (Grade per subject), Behaviour timeline

### Module 5: Teacher Management & Performance
- **Admin:** Add/edit teacher details (name, department, subjects, qualification); no performance review
- **Principal:** Star rating form + feedback text area (write/update evaluations)
- Profile card grid: photo, name, subject, attendance status, lesson plan status, rating

### Module 6: Admissions (Admin only)
- "New Admission" button opens comprehensive modal form
- Fields: student info + parent/guardian info
- Submitted admissions appear in pending list with Approve/Reject actions
- Approved admissions become new students in the system

### Module 7: Timetable
- Class selector buttons at top (Grade 1-A through Grade 10-B)
- CSS Grid display: rows = periods (with time labels), columns = Mon–Fri
- Each cell shows: Subject + Room number
- Admin: "Edit Schedule" button enables inline editing of any cell

### Module 8: Lesson Plans
- **Teacher:** Create plan with topic, objectives, materials, activities, assessment; submit for HOD approval; view HOD status + remarks
- **HOD:** List of pending plans; "View Details" modal with full plan; Approve / Reject with remarks

### Module 9: Student Marking (Teacher only)
- Step 1: Select Class (Grade 1-A through Grade 10-B)
- Step 2: Select Student from list (auto-shows Roll No. 1 by default)
- Attendance card: Read-only progress bar (non-editable)
- Exam Marks card: 4 fixed exams (IA-1, Midterm, IA-2, Final Exam) with Update Marks button
- Assignments card: Create unlimited assignments + Update button
- Behaviour card: Text timeline with "Add Note" capability

### Module 10: Department Management (Principal)
- List of all departments
- Assign/change HOD for each department (dropdown of eligible teachers)
- View teachers assigned to each department

### Module 11: Teacher Assignment (HOD)
- View teachers in own department
- Assign teacher to specific class(es) and subject(s)
- Remove/reassign class allocations

### Module 12: Settings (Admin only)
- System info: version, installation details
- Training resources: downloadable PDF manuals list
- No contact support section

---

## 10. File & Folder Structure

### Complete Frontend Structure

```
educore-frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles/
    │   └── globals.css
    └── components/
        ├── Login.tsx
        ├── Sidebar.tsx
        ├── Header.tsx
        ├── StudentPerformance.tsx
        ├── TeacherPerformance.tsx
        ├── Timetable.tsx
        ├── admin/
        │   ├── AdminDashboard.tsx
        │   ├── FeesManagement.tsx
        │   ├── Admissions.tsx
        │   ├── StudentManagement.tsx
        │   ├── TeacherManagement.tsx
        │   └── Settings.tsx
        ├── principal/
        │   ├── PrincipalDashboard.tsx
        │   ├── TeacherEvaluation.tsx
        │   └── DepartmentManagement.tsx
        ├── hod/
        │   ├── HodDashboard.tsx
        │   └── TeacherAssignment.tsx
        └── teacher/
            ├── TeacherDashboard.tsx
            ├── MyClasses.tsx
            ├── StudentMarking.tsx
            └── LessonPlans.tsx
```

### Complete Backend Structure

```
educore-backend/
├── package.json
├── tsconfig.json
├── .env
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── src/
    ├── server.ts
    ├── config/
    │   ├── db.ts
    │   └── env.ts
    ├── middleware/
    │   ├── auth.ts
    │   ├── roleGuard.ts
    │   └── errorHandler.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── students.routes.ts
    │   ├── teachers.routes.ts
    │   ├── fees.routes.ts
    │   ├── admissions.routes.ts
    │   ├── timetable.routes.ts
    │   ├── lessonPlans.routes.ts
    │   ├── departments.routes.ts
    │   ├── attendance.routes.ts
    │   ├── marks.routes.ts
    │   └── notifications.routes.ts
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── students.controller.ts
    │   ├── teachers.controller.ts
    │   ├── fees.controller.ts
    │   ├── admissions.controller.ts
    │   ├── timetable.controller.ts
    │   ├── lessonPlans.controller.ts
    │   ├── departments.controller.ts
    │   ├── attendance.controller.ts
    │   ├── marks.controller.ts
    │   └── notifications.controller.ts
    ├── services/
    │   ├── auth.service.ts
    │   ├── students.service.ts
    │   ├── fees.service.ts
    │   └── lessonPlans.service.ts
    ├── validations/
    │   ├── auth.schema.ts
    │   ├── student.schema.ts
    │   ├── fees.schema.ts
    │   └── marks.schema.ts
    └── utils/
        ├── jwt.ts
        ├── pagination.ts
        └── receiptGenerator.ts
```

---

*End of EduCore System Architecture Document*
