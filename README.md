# EduCore Backend

REST API for the EduCore School Management System — built with **Express + TypeScript + Supabase**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript 5 (strict) |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (`jsonwebtoken` + `bcryptjs`) |
| Validation | Zod |
| Dev server | ts-node-dev |

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

JWT_SECRET=<any-long-random-string>
```

> Find your keys at: **Supabase Dashboard → Project Settings → API**

### 3. Run the database schema

In the **Supabase SQL Editor**, run:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Seed test data

In the **Supabase SQL Editor**, run:

```
supabase/seed.sql
```

This creates 4 user accounts (password: `password123`):

| Email | Role |
|---|---|
| `admin@educore.school` | admin |
| `principal@educore.school` | principal |
| `hod@educore.school` | hod |
| `teacher@educore.school` | teacher |

---

## Running the Server

### Development (hot reload)

```bash
npm run dev
```

Server starts at `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

### Health check

```bash
curl http://localhost:3001/health
# → {"status":"ok","timestamp":"..."}
```

---

## API Overview

All endpoints are under `/api/*` and require `Authorization: Bearer <token>` except login.

### Authentication

```
POST /api/auth/login     — get JWT token
GET  /api/auth/me        — current user info
POST /api/auth/logout    — logout
```

**Login example:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@educore.school","password":"password123","role":"admin"}'
```

### Endpoints by module

| Module | Base path | Allowed roles |
|---|---|---|
| Departments | `/api/departments` | all |
| Students | `/api/students` | admin / principal / hod / teacher |
| Teachers | `/api/teachers` | admin / principal / hod |
| Admissions | `/api/admissions` | admin |
| Fees | `/api/fees` | admin / principal |
| Timetable | `/api/timetable` | all (write: admin) |
| Marks | `/api/marks` | teacher (write) / hod / principal (read) |
| Attendance | `/api/attendance` | teacher (write) / hod / principal (read) |
| Lesson Plans | `/api/lesson-plans` | teacher (write) / hod (approve) |
| Notifications | `/api/notifications` | all |

---

## Running Tests

Make sure the server is running (`npm run dev`) in one terminal, then in another:

```bash
npm test
```

The test suite covers **90+ assertions** across all modules:
- Login for all 4 roles
- Full CRUD flows (students, fees, marks, timetable, etc.)
- Role-based access enforcement (403 checks)
- Input validation (400 checks)
- Edge cases (invalid token, 404, invalid UUID)

---

## Project Structure

```
src/
├── config/
│   ├── db.ts          # Supabase client (admin + anon)
│   └── env.ts         # Zod-validated env vars
├── controllers/       # Route handlers (11 modules)
├── middleware/
│   ├── auth.ts        # JWT verification
│   ├── roleGuard.ts   # Role-based access control
│   └── errorHandler.ts
├── routes/            # Express routers (11 modules)
├── services/          # Business logic helpers
├── utils/
│   ├── jwt.ts
│   ├── pagination.ts
│   └── receiptGenerator.ts
├── validations/       # Zod schemas
└── server.ts          # App entry point

supabase/
├── migrations/
│   └── 001_initial_schema.sql   # Full DB schema
└── seed.sql                     # Dev seed data

tests/
└── test-all.js        # Full integration test suite
```

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run full integration test suite |
