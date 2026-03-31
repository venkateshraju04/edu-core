import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GraduationCap } from 'lucide-react';
import { authApi, setAuthToken } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'principal' | 'teacher' | 'hod'>('admin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setRole, setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await authApi.login({ email, password, role: selectedRole });

      if (!response.success || !response.token || !response.user) {
        setError('Unable to sign in. Please try again.');
        return;
      }

      setAuthToken(response.token);
      setRole(response.user.role);
      setUser(response.user);
      navigate(`/${response.user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(30, 58, 138, 0.7), rgba(30, 58, 138, 0.7)), url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-800 mb-2">EduCore</h1>
          <p className="text-slate-600">Modern School Administration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-slate-700 mb-2">
              Select Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'principal' | 'teacher' | 'hod')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="admin">Administrator</option>
              <option value="principal">Principal</option>
              <option value="hod">Head of Department (HOD)</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          {error && (
            <div className="text-center text-red-600 text-sm">{error}</div>
          )}

          <div className="text-center text-slate-500 mt-4">
            <p className="text-sm">Use your backend user email, password, and role</p>
          </div>
        </form>
      </div>
    </div>
  );
}