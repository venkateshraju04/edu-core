import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { departmentsApi, getJwtClaims, studentsApi, teachersApi, type StudentRecord, type TeacherRecord } from '../../services/api';

interface ClassOption {
  id: string;
  label: string;
}

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  if (student.classes?.grade) return `Grade ${student.classes.grade}`;
  return student.class_id;
}

export default function TeacherAssignment() {
  const claims = getJwtClaims();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [selectedClassByTeacher, setSelectedClassByTeacher] = useState<Record<string, string>>({});
  const [selectedSubjectByTeacher, setSelectedSubjectByTeacher] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const teacherResponse = claims?.departmentId
        ? await teachersApi.byDepartment(claims.departmentId)
        : await teachersApi.list();

      setTeachers(teacherResponse.data ?? []);

      const studentsResponse = await studentsApi.list('page=1&limit=400');
      const map = new Map<string, string>();
      (studentsResponse.data ?? []).forEach((student) => map.set(student.class_id, classLabel(student)));

      const classes = Array.from(map.entries()).map(([id, label]) => ({ id, label }));
      setClassOptions(classes);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load assignment data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignTeacher = async (teacher: TeacherRecord) => {
    const classId = selectedClassByTeacher[teacher.id];
    const subject = selectedSubjectByTeacher[teacher.id] || teacher.subjects?.[0] || '';

    if (!classId || !subject) {
      alert('Select class and subject first');
      return;
    }

    try {
      const departmentId = claims?.departmentId || teacher.department_id;
      await departmentsApi.assignTeacher(departmentId, {
        teacher_id: teacher.id,
        class_id: classId,
        subject,
      });
      alert('Teacher assigned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save assignment');
    }
  };

  const teacherCards = useMemo(() => teachers, [teachers]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Teacher Assignment</h1>
              <p className="text-slate-600">Assign teachers to classes in your department</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {teacherCards.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-slate-800">{teacher.users?.name || '-'}</h2>
                        <p className="text-slate-600 mt-1">{teacher.subjects?.join(', ') || '-'}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {teacher.departments?.name || 'Department'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-slate-700 mb-2">Class</label>
                      <select
                        value={selectedClassByTeacher[teacher.id] || ''}
                        onChange={(e) => setSelectedClassByTeacher((prev) => ({ ...prev, [teacher.id]: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Select class</option>
                        {classOptions.map((classOption) => (
                          <option key={classOption.id} value={classOption.id}>{classOption.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">Subject</label>
                      <input
                        value={selectedSubjectByTeacher[teacher.id] || teacher.subjects?.[0] || ''}
                        onChange={(e) => setSelectedSubjectByTeacher((prev) => ({ ...prev, [teacher.id]: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <button onClick={() => assignTeacher(teacher)} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                      Save Assignment
                    </button>
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
