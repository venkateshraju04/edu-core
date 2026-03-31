import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Plus, Edit, X } from 'lucide-react';
import { departmentsApi, teachersApi, type DepartmentRecord, type TeacherRecord } from '../../services/api';

interface TeacherForm {
  id?: string;
  name: string;
  subject: string;
  email: string;
  phone: string;
  departmentId: string;
  joiningDate: string;
  qualification: string;
  employeeId: string;
  password: string;
}

export default function TeacherManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  const [formData, setFormData] = useState<TeacherForm>({
    name: '',
    subject: '',
    email: '',
    phone: '',
    departmentId: '',
    joiningDate: '',
    qualification: '',
    employeeId: '',
    password: ''
  });

  const loadData = async () => {
    try {
      const [teacherResponse, departmentResponse] = await Promise.all([
        teachersApi.list(),
        departmentsApi.list(),
      ]);

      setTeachers(teacherResponse.data ?? []);
      const depts = departmentResponse.data ?? [];
      setDepartments(depts);

      if (!formData.departmentId && depts.length > 0) {
        setFormData((prev) => ({ ...prev, departmentId: depts[0].id }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load teachers');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((department) => map.set(department.id, department.name));
    return map;
  }, [departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, {
          name: formData.name,
          subjects: [formData.subject],
          phone: formData.phone,
          qualification: formData.qualification,
          department_id: formData.departmentId,
        });
        alert('Teacher updated successfully!');
      } else {
        await teachersApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department_id: formData.departmentId,
          employee_id: formData.employeeId,
          subjects: [formData.subject],
          qualification: formData.qualification,
          joining_date: formData.joiningDate,
          phone: formData.phone,
        });
        alert('Teacher added successfully!');
      }
      resetForm();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save teacher');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      joiningDate: '',
      qualification: '',
      employeeId: '',
      password: ''
    });
    setShowAddForm(false);
    setEditingTeacher(null);
  };

  const handleEdit = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    setFormData({
      id: teacher.id,
      name: teacher.users?.name || '',
      subject: teacher.subjects?.[0] || '',
      email: teacher.users?.email || '',
      phone: teacher.phone || '',
      departmentId: teacher.department_id,
      joiningDate: teacher.joining_date,
      qualification: teacher.qualification || '',
      employeeId: teacher.employee_id,
      password: ''
    });
    setShowAddForm(true);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-slate-800 mb-2">Teacher Management</h1>
                <p className="text-slate-600">Add and manage teacher information</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Teacher
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={teacher.users?.profile_photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'}
                      alt={teacher.users?.name || 'Teacher'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                    <div className="flex-1">
                      <h3 className="text-slate-800 mb-1">{teacher.users?.name || '-'}</h3>
                      <p className="text-slate-600 text-sm">{teacher.subjects?.join(', ') || '-'}</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mt-2">
                        {teacher.departments?.name || departmentNameMap.get(teacher.department_id) || 'Department'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-slate-600 text-sm"><span className="font-medium">Employee ID:</span> {teacher.employee_id}</p>
                    <p className="text-slate-600 text-sm"><span className="font-medium">Email:</span> {teacher.users?.email || '-'}</p>
                    <p className="text-slate-600 text-sm"><span className="font-medium">Phone:</span> {teacher.phone || '-'}</p>
                    <p className="text-slate-600 text-sm"><span className="font-medium">Joined:</span> {new Date(teacher.joining_date).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={() => handleEdit(teacher)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-slate-800">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Full Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Subject</label>
                  <input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Email</label>
                  <input type="email" required={!editingTeacher} disabled={!!editingTeacher} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg disabled:bg-slate-100" />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Phone</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                </div>
              </div>

              {!editingTeacher && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-2">Employee ID</label>
                    <input type="text" required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-2">Temporary Password</label>
                    <input type="password" minLength={8} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Department</label>
                  <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Joining Date</label>
                  <input type="date" required value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Qualification</label>
                <input type="text" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">{editingTeacher ? 'Update Teacher' : 'Add Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
