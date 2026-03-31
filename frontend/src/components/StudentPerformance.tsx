import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../App';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  attendance: number;
  grades: { subject: string; grade: string }[];
  behavior: { event: string; date: string }[];
}

const studentData: Student[] = [
  {
    id: 'S001',
    name: 'Emma Thompson',
    rollNo: '001',
    class: 'Grade 10-A',
    attendance: 92,
    grades: [
      { subject: 'Mathematics', grade: 'A' },
      { subject: 'Physics', grade: 'A-' },
      { subject: 'Chemistry', grade: 'B+' },
      { subject: 'English', grade: 'A' }
    ],
    behavior: [
      { event: 'Excellent class participation', date: 'Dec 5' },
      { event: 'Won Science Fair', date: 'Nov 28' }
    ]
  },
  {
    id: 'S002',
    name: 'James Wilson',
    rollNo: '002',
    class: 'Grade 10-A',
    attendance: 85,
    grades: [
      { subject: 'Mathematics', grade: 'B' },
      { subject: 'Physics', grade: 'B+' },
      { subject: 'Chemistry', grade: 'B' },
      { subject: 'English', grade: 'A-' }
    ],
    behavior: [
      { event: 'Late to class', date: 'Dec 8' },
      { event: 'Helped organize sports day', date: 'Nov 30' }
    ]
  },
  {
    id: 'S003',
    name: 'Olivia Brown',
    rollNo: '001',
    class: 'Grade 11-A',
    attendance: 88,
    grades: [
      { subject: 'Mathematics', grade: 'A+' },
      { subject: 'Computer Science', grade: 'A' },
      { subject: 'Physics', grade: 'A' },
      { subject: 'English', grade: 'B+' }
    ],
    behavior: [
      { event: 'Perfect homework submission', date: 'Dec 6' },
      { event: 'Student council member', date: 'Nov 15' }
    ]
  },
  {
    id: 'S004',
    name: 'Noah Davis',
    rollNo: '002',
    class: 'Grade 11-A',
    attendance: 94,
    grades: [
      { subject: 'Mathematics', grade: 'A' },
      { subject: 'Computer Science', grade: 'A+' },
      { subject: 'Physics', grade: 'A-' },
      { subject: 'English', grade: 'B+' }
    ],
    behavior: [
      { event: 'Won coding competition', date: 'Dec 2' }
    ]
  },
  {
    id: 'S005',
    name: 'Sophia Martinez',
    rollNo: '001',
    class: 'Grade 9-B',
    attendance: 90,
    grades: [
      { subject: 'Mathematics', grade: 'B+' },
      { subject: 'Science', grade: 'A' },
      { subject: 'History', grade: 'A-' },
      { subject: 'English', grade: 'A' }
    ],
    behavior: [
      { event: 'Joined debate club', date: 'Nov 20' }
    ]
  }
];

export default function StudentPerformance() {
  const { role } = useAuth();
  const classes = ['Grade 8-A', 'Grade 9-B', 'Grade 10-A', 'Grade 11-A', 'Grade 12-A'];
  const [selectedClass, setSelectedClass] = useState('Grade 10-A');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const studentsInClass = studentData.filter(s => s.class === selectedClass);

  // Set default to first roll number when class changes
  useState(() => {
    if (studentsInClass.length > 0) {
      setSelectedStudent(studentsInClass[0]);
    }
  });

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    const students = studentData.filter(s => s.class === className);
    if (students.length > 0) {
      setSelectedStudent(students[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'bg-green-500';
    if (attendance >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-200';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const isViewOnly = role === 'principal' || role === 'hod';

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
                {isViewOnly ? 'View student academic records and behavior' : 'View detailed student academic records and behavior'}
              </p>
            </div>

            {/* Class Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <label className="block text-slate-700 mb-3">Select Class</label>
              <div className="grid grid-cols-5 gap-3">
                {classes.map((className) => (
                  <button
                    key={className}
                    onClick={() => handleClassChange(className)}
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
              {/* Student List */}
              <div className="col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-slate-800 mb-4">Students in {selectedClass}</h2>
                  {studentsInClass.length > 0 ? (
                    <div className="space-y-2">
                      {studentsInClass.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
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

              {/* Student Details */}
              {selectedStudent && (
                <div className="col-span-8 space-y-6">
                  {/* Student Info Header */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xl">{selectedStudent.rollNo}</span>
                      </div>
                      <div>
                        <h2 className="text-slate-800">{selectedStudent.name}</h2>
                        <p className="text-slate-600">{selectedStudent.class} • Roll No: {selectedStudent.rollNo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Attendance</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="bg-slate-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full ${getAttendanceColor(selectedStudent.attendance)} transition-all`}
                            style={{ width: `${selectedStudent.attendance}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-slate-800 min-w-[80px] text-right">
                        {selectedStudent.attendance}% Present
                      </div>
                    </div>
                  </div>

                  {/* Grades */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Grade Report</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedStudent.grades.map((item, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getGradeColor(item.grade)}`}
                        >
                          <p className="text-sm mb-1">{item.subject}</p>
                          <p className="text-2xl">{item.grade}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavior Tracking */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-slate-800 mb-4">Behavior Timeline</h2>
                    <div className="space-y-4">
                      {selectedStudent.behavior.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="relative">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                            {index !== selectedStudent.behavior.length - 1 && (
                              <div className="absolute left-1/2 top-3 w-0.5 h-full bg-slate-200 -translate-x-1/2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-slate-800">{event.event}</p>
                            <p className="text-slate-500 text-sm mt-1">{event.date}</p>
                          </div>
                        </div>
                      ))}
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
