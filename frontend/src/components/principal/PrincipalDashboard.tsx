import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Users, TrendingUp, UserCheck, Award } from 'lucide-react';
import { attendanceApi, marksApi, studentsApi, teachersApi, type StudentRecord } from '../../services/api';

interface ClassMetric {
  grade: string;
  average: string;
  attendance: string;
  status: string;
}

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  if (student.classes?.grade) return `Grade ${student.classes.grade}`;
  return `Class ${student.class_id.slice(0, 8)}`;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default function PrincipalDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [averageGrade, setAverageGrade] = useState('N/A');
  const [classMetrics, setClassMetrics] = useState<ClassMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{ text: string; time: string }>>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [studentsResponse, teachersResponse] = await Promise.all([
        studentsApi.list('page=1&limit=500'),
        teachersApi.list(),
      ]);

      const students = studentsResponse.data ?? [];
      setTotalStudents(studentsResponse.meta?.total ?? students.length);
      setTotalTeachers(teachersResponse.meta?.total ?? (teachersResponse.data?.length || 0));

      const marksResponses = await Promise.all(students.map((student) => marksApi.byStudent(student.id)));
      const attendanceResponses = await Promise.all(students.map((student) => attendanceApi.studentSummary(student.id)));

      const allMarks = marksResponses.flatMap((response) => response.data ?? []);
      const overallScore = allMarks.length
        ? Math.round(allMarks.reduce((sum, row) => sum + Number(row.marks_obtained), 0) / allMarks.length)
        : 0;
      setAverageGrade(allMarks.length ? scoreToGrade(overallScore) : 'N/A');

      const attendancePercentages = attendanceResponses
        .map((response) => Number(response.data?.percentage || 0))
        .filter((value) => value > 0);
      const attendanceAverage = attendancePercentages.length
        ? Math.round(attendancePercentages.reduce((sum, value) => sum + value, 0) / attendancePercentages.length)
        : 0;
      setOverallAttendance(attendanceAverage);

      const byClass = new Map<string, StudentRecord[]>();
      students.forEach((student) => {
        const key = classLabel(student);
        const rows = byClass.get(key) || [];
        rows.push(student);
        byClass.set(key, rows);
      });

      const metricRows: ClassMetric[] = [];
      for (const [klass, classStudents] of byClass.entries()) {
        const markRows = allMarks.filter((mark) => classStudents.some((student) => student.id === mark.student_id));
        const avgScore = markRows.length
          ? Math.round(markRows.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0) / markRows.length)
          : 0;
        const classAttendances = attendanceResponses
          .filter((response, index) => classStudents.some((student) => student.id === students[index]?.id))
          .map((response) => Number(response.data?.percentage || 0));
        const classAttendance = classAttendances.length
          ? Math.round(classAttendances.reduce((sum, value) => sum + value, 0) / classAttendances.length)
          : 0;

        let status = 'Average';
        if (avgScore >= 85 && classAttendance >= 85) status = 'Excellent';
        else if (avgScore >= 70 && classAttendance >= 75) status = 'Good';

        metricRows.push({
          grade: klass,
          average: markRows.length ? scoreToGrade(avgScore) : 'N/A',
          attendance: `${classAttendance}%`,
          status,
        });
      }

      setClassMetrics(metricRows.slice(0, 6));

      setRecentActivities([
        {
          text: `${students.length} active students loaded across ${byClass.size} classes`,
          time: 'Live data',
        },
        {
          text: `${teachersResponse.meta?.total ?? (teachersResponse.data?.length || 0)} active teachers currently in system`,
          time: 'Live data',
        },
        {
          text: `${allMarks.length} mark entries used for academic overview`,
          time: 'Computed now',
        },
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load principal dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      title: 'Overall Attendance',
      value: loading ? '...' : `${overallAttendance}%`,
      icon: <UserCheck className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Average Student Grade',
      value: loading ? '...' : averageGrade,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Teachers',
      value: loading ? '...' : `${totalTeachers}`,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Students',
      value: loading ? '...' : `${totalStudents}`,
      icon: <Award className="w-8 h-8" />,
      color: 'bg-orange-500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-700';
      case 'Good': return 'bg-blue-100 text-blue-700';
      case 'Average': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const rows = useMemo(() => classMetrics, [classMetrics]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Principal Dashboard</h1>
              <p className="text-slate-600">School-wide overview and performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${stat.color} text-white p-3 rounded-lg`}>{stat.icon}</div>
                  </div>
                  <h3 className="text-slate-800 mb-1">{stat.value}</h3>
                  <p className="text-slate-600">{stat.title}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Class-wise Performance</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {rows.map((item) => (
                      <div key={item.grade} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-slate-800">{item.grade}</p>
                          <p className="text-slate-600 text-sm mt-1">Avg: {item.average} • Attendance: {item.attendance}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                    {rows.length === 0 && <p className="text-slate-500">No class data available.</p>}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Recent Activities</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={`${activity.text}-${index}`} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-slate-800">{activity.text}</p>
                          <p className="text-slate-500 text-sm mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
