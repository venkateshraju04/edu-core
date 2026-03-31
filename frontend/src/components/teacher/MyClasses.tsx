import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Check, X } from 'lucide-react';
import { attendanceApi, getJwtClaims, studentsApi, type StudentRecord } from '../../services/api';

interface StudentAttendance {
  id: string;
  name: string;
  rollNo: string;
  isPresent: boolean;
}

interface ClassData {
  id: string;
  name: string;
  students: StudentAttendance[];
}

function formatClassNameFromStudent(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  return `Class ${student.class_id.slice(0, 8)}`;
}

export default function MyClasses() {
  const claims = getJwtClaims();
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<Record<string, ClassData>>({});

  const loadClassStudents = async () => {
    try {
      const classIds = claims?.classIds || [];
      if (!classIds.length) {
        setClasses({});
        return;
      }

      const entries = await Promise.all(
        classIds.map(async (classId) => {
          const response = await studentsApi.byClass(classId);
          const students = response.data ?? [];
          const date = new Date().toISOString().slice(0, 10);
          const attendanceResponse = await attendanceApi.classByDate(classId, date);
          const attendanceMap = new Map((attendanceResponse.data ?? []).map((item) => [item.student_id, item.is_present]));

          const className = students[0] ? formatClassNameFromStudent(students[0]) : `Class ${classId.slice(0, 8)}`;
          const classData: ClassData = {
            id: classId,
            name: className,
            students: students.map((student) => ({
              id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              rollNo: String(student.roll_number),
              isPresent: attendanceMap.get(student.id) ?? true,
            })),
          };
          return [className, classData] as const;
        }),
      );

      const next = Object.fromEntries(entries);
      setClasses(next);
      if (!selectedClass && entries.length > 0) {
        setSelectedClass(entries[0][0]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load classes');
    }
  };

  useEffect(() => {
    loadClassStudents();
  }, []);

  const toggleAttendance = (className: string, studentId: string) => {
    setClasses((prev) => ({
      ...prev,
      [className]: {
        ...prev[className],
        students: prev[className].students.map((student) =>
          student.id === studentId ? { ...student, isPresent: !student.isPresent } : student,
        ),
      },
    }));
  };

  const currentClass = classes[selectedClass];
  const presentCount = currentClass?.students.filter((s) => s.isPresent).length || 0;
  const totalCount = currentClass?.students.length || 1;
  const attendancePercentage = Math.round((presentCount / totalCount) * 100);

  const handleSubmitAttendance = async () => {
    if (!currentClass) return;

    try {
      await attendanceApi.bulkMark({
        class_id: currentClass.id,
        date: new Date().toISOString().slice(0, 10),
        records: currentClass.students.map((student) => ({
          student_id: student.id,
          is_present: student.isPresent,
        })),
      });
      alert(`Attendance submitted for ${selectedClass}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit attendance');
    }
  };

  const classNames = useMemo(() => Object.keys(classes), [classes]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">My Classes</h1>
              <p className="text-slate-600">Manage attendance and view student lists</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-slate-800 mb-4">Classes</h2>
                  <div className="space-y-2">
                    {classNames.map((className) => (
                      <button
                        key={className}
                        onClick={() => setSelectedClass(className)}
                        className={`w-full text-left p-4 rounded-lg transition border ${
                          selectedClass === className ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-slate-800">{className}</p>
                        <p className="text-slate-600 text-sm mt-1">Assigned Class</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-9 space-y-6">
                {currentClass && (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-slate-800 mb-1">{selectedClass}</h2>
                          <p className="text-slate-600">Today&apos;s Attendance</p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                            attendancePercentage >= 90 ? 'bg-green-100 text-green-700' :
                            attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <span className="text-2xl">{attendancePercentage}%</span>
                          </div>
                          <p className="text-slate-600 text-sm mt-2">{presentCount} of {currentClass.students.length} present</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-slate-800">Student Attendance</h2>
                        <button onClick={handleSubmitAttendance} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                          Submit Attendance
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {currentClass.students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                  <span className="text-slate-600">{student.rollNo}</span>
                                </div>
                                <div>
                                  <p className="text-slate-800">{student.name}</p>
                                  <p className="text-slate-600 text-sm">Roll No: {student.rollNo}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleAttendance(selectedClass, student.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                  student.isPresent ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {student.isPresent ? <><Check className="w-4 h-4" />Present</> : <><X className="w-4 h-4" />Absent</>}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
