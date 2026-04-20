import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../App';
import {
  attendanceApi,
  marksApi,
  studentsApi,
  type AttendanceSummary,
  type MarkRecord,
  type StudentRecord,
} from '../services/api';

interface StudentUi {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
  className: string;
}

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  if (student.classes?.grade) return `Grade ${student.classes.grade}`;
  return `Class ${student.class_id.slice(0, 8)}`;
}

function gradeFromPercent(percent: number): string {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

export default function StudentPerformance() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentUi[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [marks, setMarks] = useState<MarkRecord[]>([]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.list('page=1&limit=500');
      const rows = (response.data ?? []).map((student) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        rollNo: String(student.roll_number),
        classId: student.class_id,
        className: classLabel(student),
      }));

      setStudents(rows);
      if (rows.length > 0) {
        const initialClass = rows[0].className;
        setSelectedClass(initialClass);
        setSelectedStudentId(rows.find((student) => student.className === initialClass)?.id || null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classes = useMemo(() => Array.from(new Set(students.map((student) => student.className))), [students]);
  const studentsInClass = useMemo(() => students.filter((student) => student.className === selectedClass), [students, selectedClass]);
  const selectedStudent = useMemo(
    () => studentsInClass.find((student) => student.id === selectedStudentId) || studentsInClass[0] || null,
    [studentsInClass, selectedStudentId],
  );

  useEffect(() => {
    if (!selectedStudent && studentsInClass.length > 0) {
      setSelectedStudentId(studentsInClass[0].id);
    }
  }, [selectedStudent, studentsInClass]);

  const loadStudentDetails = async (studentId: string) => {
    try {
      const [attendanceResponse, marksResponse] = await Promise.all([
        attendanceApi.studentSummary(studentId),
        marksApi.byStudent(studentId),
      ]);
      setAttendanceSummary(attendanceResponse.data || null);
      setMarks(marksResponse.data ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load student details');
      setAttendanceSummary(null);
      setMarks([]);
    }
  };

  useEffect(() => {
    if (selectedStudent?.id) {
      loadStudentDetails(selectedStudent.id);
    }
  }, [selectedStudent?.id]);

  const marksBySubject = useMemo(() => {
    const grouped = new Map<string, MarkRecord[]>();
    marks.forEach((row) => {
      const key = row.subject;
      const rows = grouped.get(key) || [];
      rows.push(row);
      grouped.set(key, rows);
    });

    return Array.from(grouped.entries()).map(([subject, rows]) => {
      const average = rows.reduce((sum, row) => sum + Number(row.marks_obtained), 0) / rows.length;
      const percent = Math.round(average);
      return { subject, percent, grade: gradeFromPercent(percent) };
    });
  }, [marks]);

  const behaviorTimeline = useMemo(() => {
    const attendanceEvents = (attendanceSummary?.records || []).slice(0, 4).map((record) => ({
      event: record.is_present ? 'Present in class' : 'Absent from class',
      date: new Date(record.date).toLocaleDateString(),
    }));

    const markEvents = marks.slice(0, 4).map((mark) => ({
      event: `${mark.subject} ${mark.exam_type}: ${mark.marks_obtained}/${mark.max_marks}`,
      date: mark.academic_year,
    }));

    return [...markEvents, ...attendanceEvents].slice(0, 8);
  }, [attendanceSummary?.records, marks]);

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'bg-green-500';
    if (attendance >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-200';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const isViewOnly = role === 'principal' || role === 'hod';
  const attendancePercent = attendanceSummary?.percentage || 0;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Student Performance</h1>
              <p className="text-slate-600">
                {isViewOnly ? 'View student academic records and attendance' : 'View detailed student academic records'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <label className="block text-slate-700 mb-3">Select Class</label>
              <div className="grid grid-cols-5 gap-3">
                {classes.map((className) => (
                  <button
                    key={className}
                    onClick={() => {
                      setSelectedClass(className);
                      setSelectedStudentId(students.find((student) => student.className === className)?.id || null);
                    }}
                    className={`px-4 py-3 rounded-lg transition border ${
                      selectedClass === className
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-slate-800 mb-4">Students in {selectedClass}</h2>
                  {loading ? (
                    <p className="text-slate-500 text-center py-8">Loading students...</p>
                  ) : studentsInClass.length > 0 ? (
                    <div className="space-y-2">
                      {studentsInClass.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full text-left p-4 rounded-lg transition border ${
                            selectedStudent?.id === student.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-slate-600">{student.rollNo}</span>
                            </div>
                            <div>
                              <p className="text-slate-800">{student.name}</p>
                              <p className="text-slate-600 text-sm">Roll No: {student.rollNo}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">No students in this class</p>
                  )}
                </div>
              </div>

              {selectedStudent && (
                <div className="col-span-8 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xl">{selectedStudent.rollNo}</span>
                      </div>
                      <div>
                        <h2 className="text-slate-800">{selectedStudent.name}</h2>
                        <p className="text-slate-600">{selectedStudent.className} • Roll No: {selectedStudent.rollNo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Attendance</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="bg-slate-200 rounded-full h-4 overflow-hidden">
                          <div className={`h-full ${getAttendanceColor(attendancePercent)} transition-all`} style={{ width: `${attendancePercent}%` }} />
                        </div>
                      </div>
                      <div className="text-slate-800 min-w-[100px] text-right">{attendancePercent}% Present</div>
                    </div>
                    <p className="text-slate-500 text-sm mt-3">
                      {attendanceSummary?.present || 0} present, {attendanceSummary?.absent || 0} absent out of {attendanceSummary?.total || 0} records
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Grade Report</h2>
                    {marksBySubject.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {marksBySubject.map((item) => (
                          <div key={item.subject} className={`p-4 rounded-lg border ${getGradeColor(item.grade)}`}>
                            <p className="text-sm mb-1">{item.subject}</p>
                            <p className="text-2xl">{item.grade}</p>
                            <p className="text-xs mt-1">Avg: {item.percent}%</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No marks available yet.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Academic Timeline</h2>
                    {behaviorTimeline.length > 0 ? (
                      <div className="space-y-4">
                        {behaviorTimeline.map((event, index) => (
                          <div key={`${event.event}-${index}`} className="flex gap-4">
                            <div className="relative">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1" />
                              {index !== behaviorTimeline.length - 1 && (
                                <div className="absolute left-1/2 top-3 w-0.5 h-full bg-slate-200 -translate-x-1/2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-slate-800">{event.event}</p>
                              <p className="text-slate-500 text-sm mt-1">{event.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No timeline events yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
