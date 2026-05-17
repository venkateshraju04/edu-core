import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/students.routes';
import teacherRoutes from './routes/teachers.routes';
import feesRoutes from './routes/fees.routes';
import admissionsRoutes from './routes/admissions.routes';
import timetableRoutes from './routes/timetable.routes';
import lessonPlanRoutes from './routes/lessonPlans.routes';
import departmentRoutes from './routes/departments.routes';
import attendanceRoutes from './routes/attendance.routes';
import marksRoutes from './routes/marks.routes';
import notificationsRoutes from './routes/notifications.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

// ── Security & Parsing ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Static Uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/students',       studentRoutes);
app.use('/api/teachers',       teacherRoutes);
app.use('/api/fees',           feesRoutes);
app.use('/api/admissions',     admissionsRoutes);
app.use('/api/timetable',      timetableRoutes);
app.use('/api/lesson-plans',   lessonPlanRoutes);
app.use('/api/departments',    departmentRoutes);
app.use('/api/attendance',     attendanceRoutes);
app.use('/api/marks',          marksRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/chat',           chatRoutes);



// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── centralised Error Handler ─────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀  EduCore API running on http://localhost:${env.PORT}`);
});

export default app;
