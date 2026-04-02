export type UserRole = "admin" | "principal" | "hod" | "teacher";

const API_BASE_URL = (((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")) || "/api";
const AUTH_TOKEN_KEY = "educore_auth_token";

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  error?: string;
  issues?: Array<{ path?: string[]; message?: string }>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: AuthUser;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  created_at?: string;
  profile_photo?: string | null;
}

export interface JwtClaims {
  userId: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
  classIds: string[];
  exp?: number;
  iat?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface BackendNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface StudentRecord {
  id: string;
  roll_number: number;
  first_name: string;
  last_name: string;
  class_id: string;
  parent_name: string;
  classes?: {
    name?: string;
    grade?: number;
    section?: string;
  } | null;
}

export interface TeacherRecord {
  id: string;
  employee_id: string;
  department_id: string;
  subjects: string[];
  joining_date: string;
  qualification?: string | null;
  phone?: string | null;
  users?: {
    name?: string;
    email?: string;
    profile_photo?: string | null;
  } | null;
  departments?: {
    name?: string;
  } | null;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  hod_id?: string | null;
  users?: {
    name?: string;
    email?: string;
  } | null;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  academic_year: string;
  term: number;
  amount_due: number;
  amount_paid: number;
  status: "paid" | "partial" | "unpaid";
  due_date: string;
  paid_date?: string | null;
  receipt_number?: string | null;
  students?: {
    first_name?: string;
    last_name?: string;
    roll_number?: number;
    class_id?: string;
    classes?: {
      name?: string;
    } | null;
  } | null;
}

export interface AdmissionRecord {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  grade_applying: number;
  parent_name: string;
  parent_email?: string;
  parent_phone: string;
  address?: string;
  previous_school?: string;
  status: "pending" | "approved" | "rejected";
}

export interface LessonPlanRecord {
  id: string;
  class_id: string;
  subject: string;
  date: string;
  topic: string;
  objectives: string;
  materials?: string;
  activities: string;
  assessment?: string;
  status: "pending" | "approved" | "rejected";
  hod_remarks?: string | null;
  classes?: {
    name?: string;
  } | null;
  teachers?: {
    id: string;
    users?: {
      name?: string;
    } | null;
  } | null;
}

export interface TimetableSlot {
  id: string;
  class_id: string;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  period_number: number;
  start_time: string;
  end_time: string;
  subject: string;
  room?: string | null;
  teacher_id?: string | null;
  teachers?: {
    users?: {
      name?: string;
    } | null;
  } | null;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getJwtClaims(): JwtClaims | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

function buildErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  if (payload.issues?.length) {
    return payload.issues
      .map((issue) => issue.message)
      .filter(Boolean)
      .join(", ");
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorPayload | null;

  if (!response.ok) {
    throw new ApiError(buildErrorMessage(payload as ApiErrorPayload, `Request failed with status ${response.status}`), response.status);
  }

  return (payload ?? { success: true }) as ApiEnvelope<T>;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<never>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<AuthUser>("/auth/me"),

  logout: () =>
    request<never>("/auth/logout", {
      method: "POST",
    }),
};

export const notificationsApi = {
  list: () => request<BackendNotification[]>("/notifications"),
  markRead: (id: string) =>
    request<BackendNotification>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
};

export const studentsApi = {
  list: (query?: string) => request<StudentRecord[]>(`/students${query ? `?${query}` : ""}`),
  byClass: (classId: string) => request<StudentRecord[]>(`/students/class/${classId}`),
};

export const teachersApi = {
  list: () => request<TeacherRecord[]>("/teachers"),
  create: (payload: Record<string, unknown>) =>
    request<TeacherRecord>("/teachers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    request<TeacherRecord>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  byDepartment: (departmentId: string) => request<TeacherRecord[]>(`/teachers/department/${departmentId}`),
};

export const feesApi = {
  list: (query?: string) => request<FeeRecord[]>(`/fees${query ? `?${query}` : ""}`),
  update: (id: string, amountPaid: number, paidDate?: string) =>
    request<FeeRecord>(`/fees/${id}`, {
      method: "PUT",
      body: JSON.stringify({ amount_paid: amountPaid, ...(paidDate ? { paid_date: paidDate } : {}) }),
    }),
  receipt: (id: string) => request<FeeRecord & { receiptText?: string }>(`/fees/${id}/receipt`),
};

export const admissionsApi = {
  list: (query?: string) => request<AdmissionRecord[]>(`/admissions${query ? `?${query}` : ""}`),
  create: (payload: Record<string, unknown>) =>
    request<AdmissionRecord>("/admissions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  approve: (id: string, classId: string) =>
    request<AdmissionRecord>(`/admissions/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ class_id: classId }),
    }),
  reject: (id: string) =>
    request<AdmissionRecord>(`/admissions/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
};

export const departmentsApi = {
  list: () => request<DepartmentRecord[]>("/departments"),
  assignHod: (departmentId: string, hodUserId: string) =>
    request<DepartmentRecord>(`/departments/${departmentId}/hod`, {
      method: "PUT",
      body: JSON.stringify({ hod_user_id: hodUserId }),
    }),
  assignTeacher: (departmentId: string, payload: { teacher_id: string; class_id: string; subject: string }) =>
    request<never>(`/departments/${departmentId}/teachers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const lessonPlansApi = {
  list: (query?: string) => request<LessonPlanRecord[]>(`/lesson-plans${query ? `?${query}` : ""}`),
  create: (payload: Record<string, unknown>) =>
    request<LessonPlanRecord>("/lesson-plans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  approve: (id: string) =>
    request<LessonPlanRecord>(`/lesson-plans/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  reject: (id: string, hodRemarks: string) =>
    request<LessonPlanRecord>(`/lesson-plans/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ hod_remarks: hodRemarks }),
    }),
};

export const timetableApi = {
  byClass: (classId: string) => request<TimetableSlot[]>(`/timetable/class/${classId}`),
};

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  class_id: string;
  date: string;
  is_present: boolean;
  students?: {
    first_name?: string;
    last_name?: string;
    roll_number?: number;
  } | null;
}

export interface MarkRecord {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  exam_type: 'ia1' | 'ia2' | 'midterm' | 'final_exam' | 'assignment';
  assignment_no?: number | null;
  max_marks: number;
  marks_obtained: number;
  academic_year: string;
}

export const attendanceApi = {
  classByDate: (classId: string, date: string) => request<AttendanceRecord[]>(`/attendance/class/${classId}/date/${date}`),
  bulkMark: (payload: { class_id: string; date: string; records: Array<{ student_id: string; is_present: boolean }> }) =>
    request<AttendanceRecord[]>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const marksApi = {
  byStudent: (studentId: string, academicYear?: string) =>
    request<MarkRecord[]>(`/marks/student/${studentId}${academicYear ? `?academic_year=${academicYear}` : ''}`),
  create: (payload: Record<string, unknown>) =>
    request<MarkRecord>('/marks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    request<MarkRecord>(`/marks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
