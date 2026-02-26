-- ============================================================
-- EduCore – Supabase SQL Schema
-- Run this in the Supabase SQL Editor (or as a migration)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'principal', 'hod', 'teacher');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE admission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE fee_status AS ENUM ('paid', 'partial', 'unpaid');
CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
CREATE TYPE lesson_plan_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE exam_type AS ENUM ('ia1', 'ia2', 'midterm', 'final_exam', 'assignment');

-- ─────────────────────────────────────────────
-- 1. DEPARTMENTS (no FK deps on creation)
-- ─────────────────────────────────────────────

CREATE TABLE departments (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  hod_id        UUID,        -- FK to users added below after users table is created
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. USERS
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  department_id   UUID         REFERENCES departments(id) ON DELETE SET NULL,
  profile_photo   VARCHAR(255),
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Now that users exists, add the FK on departments.hod_id
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_hod
  FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- 3. CLASSES
-- ─────────────────────────────────────────────

CREATE TABLE classes (
  id       UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade    INT      NOT NULL CHECK (grade BETWEEN 1 AND 10),
  section  CHAR(1)  NOT NULL CHECK (section IN ('A', 'B')),
  name     VARCHAR(20) NOT NULL,
  capacity INT      NOT NULL DEFAULT 40,
  UNIQUE (grade, section)
);

-- ─────────────────────────────────────────────
-- 4. STUDENTS
-- ─────────────────────────────────────────────

CREATE TABLE students (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_number      INT           NOT NULL,
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  date_of_birth    DATE          NOT NULL,
  gender           gender_type   NOT NULL,
  class_id         UUID          NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  parent_name      VARCHAR(150)  NOT NULL,
  parent_email     VARCHAR(150),
  parent_phone     VARCHAR(20)   NOT NULL,
  address          TEXT,
  previous_school  VARCHAR(200),
  profile_photo    VARCHAR(255),
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ADMISSIONS
-- ─────────────────────────────────────────────

CREATE TABLE admissions (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name       VARCHAR(100)      NOT NULL,
  last_name        VARCHAR(100)      NOT NULL,
  date_of_birth    DATE              NOT NULL,
  gender           gender_type       NOT NULL,
  grade_applying   INT               NOT NULL CHECK (grade_applying BETWEEN 1 AND 10),
  parent_name      VARCHAR(150)      NOT NULL,
  parent_email     VARCHAR(150),
  parent_phone     VARCHAR(20)       NOT NULL,
  address          TEXT,
  previous_school  VARCHAR(200),
  status           admission_status  NOT NULL DEFAULT 'pending',
  reviewed_by      UUID              REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMP,
  created_at       TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. TEACHERS
-- ─────────────────────────────────────────────

CREATE TABLE teachers (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_id     VARCHAR(20)    NOT NULL UNIQUE,
  department_id   UUID           NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  subjects        TEXT[]         NOT NULL DEFAULT '{}',
  qualification   VARCHAR(200),
  joining_date    DATE           NOT NULL,
  phone           VARCHAR(20),
  is_active       BOOLEAN        NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────
-- 7. CLASS_TEACHERS  (teacher ↔ class junction)
-- ─────────────────────────────────────────────

CREATE TABLE class_teachers (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id   UUID         NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id     UUID         NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject      VARCHAR(100) NOT NULL,
  assigned_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  assigned_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_id, class_id, subject)
);

-- ─────────────────────────────────────────────
-- 8. FEES
-- ─────────────────────────────────────────────

CREATE TABLE fees (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID           NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year   VARCHAR(10)    NOT NULL,
  term            INT            NOT NULL CHECK (term BETWEEN 1 AND 3),
  amount_due      DECIMAL(10,2)  NOT NULL,
  amount_paid     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  due_date        DATE           NOT NULL,
  paid_date       DATE,
  status          fee_status     NOT NULL DEFAULT 'unpaid',
  receipt_number  VARCHAR(50)    UNIQUE,
  updated_by      UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. TIMETABLE
-- ─────────────────────────────────────────────

CREATE TABLE timetable (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id       UUID          NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week    day_of_week   NOT NULL,
  period_number  INT           NOT NULL CHECK (period_number BETWEEN 1 AND 8),
  start_time     TIME          NOT NULL,
  end_time       TIME          NOT NULL,
  subject        VARCHAR(100)  NOT NULL,
  teacher_id     UUID          REFERENCES teachers(id) ON DELETE SET NULL,
  room           VARCHAR(50),
  updated_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, day_of_week, period_number)
);

-- ─────────────────────────────────────────────
-- 10. LESSON PLANS
-- ─────────────────────────────────────────────

CREATE TABLE lesson_plans (
  id            UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id    UUID                NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id      UUID                NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject       VARCHAR(100)        NOT NULL,
  date          DATE                NOT NULL,
  topic         VARCHAR(200)        NOT NULL,
  objectives    TEXT                NOT NULL,
  materials     TEXT,
  activities    TEXT                NOT NULL,
  assessment    TEXT,
  status        lesson_plan_status  NOT NULL DEFAULT 'pending',
  reviewed_by   UUID                REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMP,
  hod_remarks   TEXT,
  created_at    TIMESTAMP           NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. ATTENDANCE
-- ─────────────────────────────────────────────

CREATE TABLE attendance (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    UUID      NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date        DATE      NOT NULL,
  is_present  BOOLEAN   NOT NULL,
  marked_by   UUID      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, class_id, date)
);

-- ─────────────────────────────────────────────
-- 12. MARKS
-- ─────────────────────────────────────────────

CREATE TABLE marks (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID           NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id         UUID           NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject          VARCHAR(100)   NOT NULL,
  exam_type        exam_type      NOT NULL,
  assignment_no    INT,
  max_marks        DECIMAL(5,2)   NOT NULL,
  marks_obtained   DECIMAL(5,2)   NOT NULL,
  academic_year    VARCHAR(10)    NOT NULL,
  entered_by       UUID           REFERENCES users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 13. BEHAVIOR RECORDS
-- ─────────────────────────────────────────────

CREATE TABLE behavior_records (
  id           UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id     UUID      NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  recorded_by  UUID      REFERENCES users(id) ON DELETE SET NULL,
  description  TEXT      NOT NULL,
  recorded_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 14. TEACHER EVALUATIONS
-- ─────────────────────────────────────────────

CREATE TABLE teacher_evaluations (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id     UUID           NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  evaluated_by   UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating         DECIMAL(3,1)   NOT NULL CHECK (rating BETWEEN 0 AND 5),
  feedback       TEXT           NOT NULL,
  academic_year  VARCHAR(10)    NOT NULL,
  evaluated_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE notifications (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID          REFERENCES users(id) ON DELETE CASCADE,
  role_target  user_role[],
  title        VARCHAR(200)  NOT NULL,
  body         TEXT          NOT NULL,
  type         VARCHAR(50)   NOT NULL,
  is_read      BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────

CREATE INDEX idx_students_class      ON students(class_id);
CREATE INDEX idx_fees_student        ON fees(student_id);
CREATE INDEX idx_fees_status         ON fees(status);
CREATE INDEX idx_attendance_student  ON attendance(student_id);
CREATE INDEX idx_attendance_date     ON attendance(date);
CREATE INDEX idx_marks_student       ON marks(student_id);
CREATE INDEX idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_status  ON lesson_plans(status);
CREATE INDEX idx_notifications_user   ON notifications(user_id);
CREATE INDEX idx_notifications_role   ON notifications USING GIN(role_target);
CREATE INDEX idx_timetable_class      ON timetable(class_id);

-- ─────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_fees_updated_at
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lesson_plans_updated_at
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
