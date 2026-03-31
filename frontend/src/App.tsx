import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import PrincipalDashboard from "./components/principal/PrincipalDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import HodDashboard from "./components/hod/HodDashboard";
import FeesManagement from "./components/admin/FeesManagement";
import StudentPerformance from "./components/StudentPerformance";
import TeacherPerformance from "./components/TeacherPerformance";
import Admissions from "./components/admin/Admissions";
import Timetable from "./components/Timetable";
import Settings from "./components/admin/Settings";
import MyClasses from "./components/teacher/MyClasses";
import LessonPlans from "./components/teacher/LessonPlans";
import TeacherEvaluation from "./components/principal/TeacherEvaluation";
import TeacherManagement from "./components/admin/TeacherManagement";
import DepartmentManagement from "./components/principal/DepartmentManagement";
import TeacherAssignment from "./components/hod/TeacherAssignment";
import StudentManagement from "./components/admin/StudentManagement";
import StudentMarking from "./components/teacher/StudentMarking";
import { authApi, clearAuthToken, getAuthToken, type AuthUser } from "./services/api";

type UserRole =
  | "admin"
  | "principal"
  | "teacher"
  | "hod"
  | null;

interface AuthContextType {
  role: UserRole;
  user: AuthUser | null;
  loading: boolean;
  setRole: (role: UserRole) => void;
  setUser: (user: AuthUser | null) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within AuthProvider");
  return context;
};

function App() {
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setRole(null);
        setUser(null);
        return;
      }

      const response = await authApi.me();
      if (response.success && response.data) {
        setUser(response.data);
        setRole(response.data.role);
        return;
      }

      clearAuthToken();
      setRole(null);
      setUser(null);
    } catch {
      clearAuthToken();
      setRole(null);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort server logout; local cleanup still needed.
    }
    clearAuthToken();
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, setRole, setUser, refreshSession, logout }}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              loading ? <div className="min-h-screen bg-slate-50" /> : role ? <Navigate to={`/${role}`} /> : <Login />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              role === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/fees"
            element={
              role === "admin" ? (
                <FeesManagement />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/students"
            element={
              role === "admin" ? (
                <StudentManagement />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/teachers"
            element={
              role === "admin" ? (
                <TeacherManagement />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/admissions"
            element={
              role === "admin" ? (
                <Admissions />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/timetable"
            element={
              role === "admin" ? (
                <Timetable />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin/settings"
            element={
              role === "admin" ? (
                <Settings />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Principal Routes */}
          <Route
            path="/principal"
            element={
              role === "principal" ? (
                <PrincipalDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/principal/teachers"
            element={
              role === "principal" ? (
                <TeacherEvaluation />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/principal/students"
            element={
              role === "principal" ? (
                <StudentPerformance />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/principal/departments"
            element={
              role === "principal" ? (
                <DepartmentManagement />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* HOD Routes */}
          <Route
            path="/hod"
            element={
              role === "hod" ? (
                <HodDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/hod/teachers"
            element={
              role === "hod" ? (
                <TeacherAssignment />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/hod/lessons"
            element={
              role === "hod" ? (
                <LessonPlans />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/hod/students"
            element={
              role === "hod" ? (
                <StudentPerformance />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              role === "teacher" ? (
                <TeacherDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/teacher/classes"
            element={
              role === "teacher" ? (
                <MyClasses />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/teacher/lessons"
            element={
              role === "teacher" ? (
                <LessonPlans />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/teacher/marking"
            element={
              role === "teacher" ? (
                <StudentMarking />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;