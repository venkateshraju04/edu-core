import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { BookOpen, Clock, ClipboardCheck, AlertCircle } from 'lucide-react';
import { attendanceApi, getJwtClaims, lessonPlansApi, studentsApi, timetableApi, type TimetableSlot } from '../../services/api';

interface UpcomingClass {
  time: string;
  subject: string;
  className: string;
  room: string;
}

function displayTime(isoTime: string): string {
  const [hour = '00', minute = '00'] = isoTime.split(':');
  const h = Number(hour);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const twelve = h % 12 || 12;
  return `${twelve}:${minute} ${suffix}`;
}

function classNameFromSlot(slot: TimetableSlot): string {
  return slot.class_id.slice(0, 8);
}

export default function TeacherDashboard() {
  const claims = getJwtClaims();
  const [loading, setLoading] = useState(true);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [pendingLessonPlans, setPendingLessonPlans] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Array<{ text: string; time: string }>>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const classIds = claims?.classIds || [];
      const today = new Date().toISOString().slice(0, 10);

      const [plansResponse, studentResponses, slotResponses, attendanceResponses] = await Promise.all([
        lessonPlansApi.list('status=pending&page=1&limit=100'),
        Promise.all(classIds.map((classId) => studentsApi.byClass(classId))),
        Promise.all(classIds.map((classId) => timetableApi.byClass(classId))),
        Promise.all(classIds.map((classId) => attendanceApi.classByDate(classId, today))),
      ]);

      const allStudents = studentResponses.flatMap((response) => response.data ?? []);
      const allSlots = slotResponses.flatMap((response) => response.data ?? []);
      const todayAttendance = attendanceResponses.flatMap((response) => response.data ?? []);
      const pendingPlans = plansResponse.data ?? [];

      setStudentCount(allStudents.length);
      setPendingLessonPlans(pendingPlans.length);

      const present = todayAttendance.filter((row) => row.is_present).length;
      const total = todayAttendance.length;
      setAttendancePercent(total > 0 ? Math.round((present / total) * 100) : 0);

      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const nextClasses = allSlots
        .filter((slot) => slot.day_of_week === dayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
        .slice(0, 4)
        .map((slot) => ({
          time: `${displayTime(slot.start_time)} - ${displayTime(slot.end_time)}`,
          subject: slot.subject,
          className: classNameFromSlot(slot),
          room: slot.room || 'TBA',
        }));
      setUpcomingClasses(nextClasses);

      setRecentActivities([
        ...pendingPlans.slice(0, 3).map((plan) => ({
          text: `Lesson plan pending: ${plan.topic}`,
          time: new Date(plan.date).toLocaleDateString(),
        })),
        {
          text: `Attendance captured for ${present}/${total || 0} students today`,
          time: 'Today',
        },
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const nextClass = useMemo(() => upcomingClasses[0], [upcomingClasses]);

  const stats = [
    {
      title: 'My Student Attendance',
      value: loading ? '...' : `${attendancePercent}%`,
      icon: <ClipboardCheck className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Upcoming Class',
      value: loading ? '...' : nextClass ? `${nextClass.subject}` : 'No class today',
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Lesson Plans',
      value: loading ? '...' : String(pendingLessonPlans),
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Students in My Classes',
      value: loading ? '...' : String(studentCount),
      icon: <AlertCircle className="w-8 h-8" />,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Teacher Dashboard</h1>
              <p className="text-slate-600">Welcome back, {claims?.name || 'Teacher'}</p>
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
                  <h2 className="text-slate-800">Today's Schedule</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingClasses.length > 0 ? upcomingClasses.map((classItem, index) => (
                      <div key={`${classItem.subject}-${index}`} className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <div className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 px-4 py-2 rounded-lg min-w-[130px]">
                          <span className="text-xs">Time</span>
                          <span className="mt-1">{classItem.time}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-slate-800 mb-1">{classItem.subject}</h3>
                          <p className="text-slate-600 text-sm">
                            Class {classItem.className} • {classItem.room}
                          </p>
                        </div>
                      </div>
                    )) : <p className="text-slate-500">No scheduled classes today.</p>}
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
