import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { UserPlus } from 'lucide-react';
import { admissionsApi, studentsApi, type AdmissionRecord, type StudentRecord } from '../../services/api';

interface ClassOption {
  id: string;
  label: string;
}

function classLabel(student: StudentRecord): string {
  const name = student.classes?.name;
  if (name) return name;

  const grade = student.classes?.grade;
  const section = student.classes?.section;
  if (grade && section) return `Grade ${grade}-${section}`;
  if (grade) return `Grade ${grade}`;
  return 'Unassigned';
}

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [classSelectionByAdmission, setClassSelectionByAdmission] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, admissionsResponse] = await Promise.all([
        studentsApi.list('page=1&limit=200'),
        admissionsApi.list('status=pending&page=1&limit=100'),
      ]);

      setStudents(studentsResponse.data ?? []);
      setAdmissions(admissionsResponse.data ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      map.set(student.class_id, classLabel(student));
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [students]);

  const classes = ['All Classes', ...Array.from(new Set(students.map((s) => classLabel(s))))];

  const handleApproveAdmission = async (admission: AdmissionRecord) => {
    const selectedClassId = classSelectionByAdmission[admission.id] || classOptions[0]?.id;

    if (!selectedClassId) {
      alert('No classes available yet. Add at least one class/student record in backend first.');
      return;
    }

    try {
      await admissionsApi.approve(admission.id, selectedClassId);
      await loadData();
      alert(`${admission.first_name} ${admission.last_name} has been added to the selected class.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve admission');
    }
  };

  const filteredStudents = selectedClass === 'All Classes'
    ? students
    : students.filter((s) => classLabel(s) === selectedClass);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Student Management</h1>
              <p className="text-slate-600">Manage admissions and student records</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-slate-800">Pending Admissions</h2>
                <button
                  onClick={loadData}
                  className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Refresh
                </button>
              </div>
              <div className="p-6">
                {loading ? (
                  <p className="text-slate-500 text-center py-8">Loading admissions...</p>
                ) : admissions.length > 0 ? (
                  <div className="space-y-3">
                    {admissions.map((admission) => (
                      <div
                        key={admission.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserPlus className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-slate-800">{admission.first_name} {admission.last_name}</p>
                              <p className="text-slate-600 text-sm">
                                Applying Grade {admission.grade_applying} • Parent: {admission.parent_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={classSelectionByAdmission[admission.id] || classOptions[0]?.id || ''}
                              onChange={(e) => setClassSelectionByAdmission((prev) => ({
                                ...prev,
                                [admission.id]: e.target.value,
                              }))}
                              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                            >
                              {classOptions.map((option: ClassOption) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleApproveAdmission(admission)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              Add to Class
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No pending admissions</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-slate-800">Current Students</h2>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-6">
                {loading ? (
                  <p className="text-slate-500 text-center py-8">Loading students...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-slate-700">Student ID</th>
                          <th className="px-6 py-3 text-left text-slate-700">Name</th>
                          <th className="px-6 py-3 text-left text-slate-700">Roll No</th>
                          <th className="px-6 py-3 text-left text-slate-700">Class</th>
                          <th className="px-6 py-3 text-left text-slate-700">Parent Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="px-6 py-4 text-slate-800">{student.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-slate-800">{student.first_name} {student.last_name}</td>
                            <td className="px-6 py-4 text-slate-600">{student.roll_number}</td>
                            <td className="px-6 py-4 text-slate-600">{classLabel(student)}</td>
                            <td className="px-6 py-4 text-slate-600">{student.parent_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
