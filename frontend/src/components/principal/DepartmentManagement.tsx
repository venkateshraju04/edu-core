import { useEffect, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Users } from 'lucide-react';
import { departmentsApi, teachersApi, type DepartmentRecord } from '../../services/api';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [teacherCountByDept, setTeacherCountByDept] = useState<Record<string, number>>({});
  const [hodInputByDept, setHodInputByDept] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const response = await departmentsApi.list();
      const rows = response.data ?? [];
      setDepartments(rows);

      const countEntries = await Promise.all(
        rows.map(async (dept) => {
          const teachers = await teachersApi.byDepartment(dept.id);
          return [dept.id, (teachers.data ?? []).length] as const;
        }),
      );

      setTeacherCountByDept(Object.fromEntries(countEntries));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load departments');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignHod = async (departmentId: string) => {
    const hodUserId = hodInputByDept[departmentId]?.trim();
    if (!hodUserId) {
      alert('Enter a valid HOD user UUID');
      return;
    }

    try {
      await departmentsApi.assignHod(departmentId, hodUserId);
      await loadData();
      alert('HOD assigned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign HOD');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Department Management</h1>
              <p className="text-slate-600">Assign HODs and review department staffing</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-slate-800">{dept.name} Department</h2>
                        <p className="text-slate-600 mt-1">Head of Department: {dept.users?.name || 'Not Assigned'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-5 h-5" />
                        <span>{teacherCountByDept[dept.id] || 0} Teachers</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <label className="block text-slate-700 mb-2">Assign HOD (User UUID)</label>
                    <div className="flex gap-3">
                      <input
                        value={hodInputByDept[dept.id] || ''}
                        onChange={(e) => setHodInputByDept((prev) => ({ ...prev, [dept.id]: e.target.value }))}
                        placeholder="e.g. 0f6fdac9-..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg"
                      />
                      <button
                        onClick={() => assignHod(dept.id)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                      >
                        Assign
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Use the HOD user's UUID from backend users table.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
