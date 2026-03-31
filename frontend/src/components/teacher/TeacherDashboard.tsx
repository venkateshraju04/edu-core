import Sidebar from '../Sidebar';
import Header from '../Header';
import { BookOpen, Clock, ClipboardCheck, AlertCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const stats = [
    {
      title: 'My Student Attendance',
      value: '85%',
      icon: <ClipboardCheck className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Upcoming Class',
      value: 'Physics 10A',
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Lesson Plans',
      value: '2',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Assignments to Grade',
      value: '15',
      icon: <AlertCircle className="w-8 h-8" />,
      color: 'bg-red-500'
    }
  ];

  const upcomingClasses = [
    { time: '9:00 AM', subject: 'Physics', class: 'Grade 10-A', room: 'Room 203' },
    { time: '11:00 AM', subject: 'Physics Lab', class: 'Grade 11-B', room: 'Lab 2' },
    { time: '2:00 PM', subject: 'Physics', class: 'Grade 9-C', room: 'Room 203' }
  ];

  const recentActivities = [
    { text: 'Grade 10-A quiz results submitted', time: '2 hours ago' },
    { text: 'Lesson plan for Dec 10 approved', time: '5 hours ago' },
    { text: 'Attendance marked for Grade 11-B', time: '1 day ago' },
    { text: 'Parent meeting scheduled with Mrs. Johnson', time: '2 days ago' }
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
              <p className="text-slate-600">Welcome back, Prof. Michael Chen</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${stat.color} text-white p-3 rounded-lg`}>
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-slate-800 mb-1">{stat.value}</h3>
                  <p className="text-slate-600">{stat.title}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Today&apos;s Schedule</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingClasses.map((classItem, index) => (
                      <div key={index} className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <div className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 px-4 py-2 rounded-lg min-w-[80px]">
                          <span className="text-xs">Time</span>
                          <span className="mt-1">{classItem.time}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-slate-800 mb-1">{classItem.subject}</h3>
                          <p className="text-slate-600 text-sm">
                            {classItem.class} • {classItem.room}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Recent Activities</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
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
