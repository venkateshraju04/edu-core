import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { getJwtClaims, marksApi, studentsApi, type MarkRecord, type StudentRecord } from '../../services/api';

interface StudentUi {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
  className: string;
}

interface MarkInput {
  ia1: number;
  ia2: number;
  midterm: number;
  finalExam: number;
}

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  return `Class ${student.class_id.slice(0, 8)}`;
}

export default function StudentMarking() {
  const claims = getJwtClaims();
  const [students, setStudents] = useState<StudentUi[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [markState, setMarkState] = useState<MarkInput>({ ia1: 0, ia2: 0, midterm: 0, finalExam: 0 });
  const [existingMarks, setExistingMarks] = useState<Record<string, MarkRecord>>({});
  const [academicYear, setAcademicYear] = useState('2025-26');

  const loadStudents = async () => {
    try {
      const classIds = claims?.classIds || [];
      const responses = await Promise.all(classIds.map((classId) => studentsApi.byClass(classId)));
      const rows = responses
        .flatMap((response) => response.data ?? [])
        .map((student) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          rollNo: String(student.roll_number),
          classId: student.class_id,
          className: classLabel(student),
        }));

      setStudents(rows);
      if (!selectedClass && rows.length > 0) {
        setSelectedClass(rows[0].className);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load students');
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classNames = useMemo(() => Array.from(new Set(students.map((student) => student.className))), [students]);
  const currentStudents = useMemo(() => students.filter((student) => student.className === selectedClass), [students, selectedClass]);

  const currentStudent = currentStudents.find((student) => student.id === selectedStudent) || null;

  const loadStudentMarks = async (studentId: string) => {
    try {
      const response = await marksApi.byStudent(studentId, academicYear);
      const rows = response.data ?? [];

      const byExam = new Map(rows.map((row) => [row.exam_type, row]));
      setExistingMarks(Object.fromEntries(rows.map((row) => [row.exam_type, row])));
      setMarkState({
        ia1: Number(byExam.get('ia1')?.marks_obtained || 0),
        ia2: Number(byExam.get('ia2')?.marks_obtained || 0),
        midterm: Number(byExam.get('midterm')?.marks_obtained || 0),
        finalExam: Number(byExam.get('final_exam')?.marks_obtained || 0),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load marks');
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMarks(selectedStudent);
    }
  }, [selectedStudent, academicYear]);

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedStudent(null);
  };

  const updateMarkField = (field: keyof MarkInput, value: number) => {
    setMarkState((prev) => ({ ...prev, [field]: value }));
  };

  const saveMark = async (examType: 'ia1' | 'ia2' | 'midterm' | 'final_exam', value: number) => {
    if (!currentStudent) return;

    const existing = existingMarks[examType];

    try {
      if (existing) {
        await marksApi.update(existing.id, { marks_obtained: value, max_marks: 100 });
      } else {
        await marksApi.create({
          student_id: currentStudent.id,
          class_id: currentStudent.classId,
          subject: 'General',
          exam_type: examType,
          max_marks: 100,
          marks_obtained: value,
          academic_year: academicYear,
        });
      }
      await loadStudentMarks(currentStudent.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to save ${examType}`);
    }
  };

  const saveAllMarks = async () => {
    await saveMark('ia1', markState.ia1);
    await saveMark('ia2', markState.ia2);
    await saveMark('midterm', markState.midterm);
    await saveMark('final_exam', markState.finalExam);
    alert('All marks saved');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Student Marking</h1>
              <p className="text-slate-600">Update student marks by exam type</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <label className="block text-slate-700 mb-3">Select Class</label>
              <div className="grid grid-cols-3 gap-3">
                {classNames.map((className) => (
                  <button
                    key={className}
                    onClick={() => handleClassChange(className)}
                    className={`px-4 py-3 rounded-lg transition border ${
                      selectedClass === className ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
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
                  {currentStudents.length > 0 ? (
                    <div className="space-y-2">
                      {currentStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={`w-full text-left p-4 rounded-lg transition border ${
                            selectedStudent === student.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center"><span className="text-slate-600">{student.rollNo}</span></div>
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

              {currentStudent && (
                <div className="col-span-8 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-1">{currentStudent.name}</h2>
                    <p className="text-slate-600">{selectedClass} • Roll No: {currentStudent.rollNo}</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-slate-800">Exam Marks (Out of 100)</h2>
                      <div className="flex items-center gap-3">
                        <input
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="2025-26"
                        />
                        <button onClick={saveAllMarks} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Save All</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 mb-2">IA-1</label>
                        <input type="number" min="0" max="100" value={markState.ia1} onChange={(e) => updateMarkField('ia1', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-2">Midterm</label>
                        <input type="number" min="0" max="100" value={markState.midterm} onChange={(e) => updateMarkField('midterm', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-2">IA-2</label>
                        <input type="number" min="0" max="100" value={markState.ia2} onChange={(e) => updateMarkField('ia2', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-2">Final Exam</label>
                        <input type="number" min="0" max="100" value={markState.finalExam} onChange={(e) => updateMarkField('finalExam', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                      </div>
                    </div>
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
