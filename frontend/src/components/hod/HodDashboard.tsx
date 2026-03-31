import Sidebar from '../Sidebar';
import Header from '../Header';
import { Users, BookOpen, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HodDashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Department Teachers',
      value: '12',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Students',
      value: '320',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Lesson Plans',
      value: '5',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Avg Attendance',
      value: '87%',
      icon: <ClipboardCheck className="w-8 h-8" />,
      color: 'bg-purple-500'
    }
  ];

  const pendingApprovals = [
    { teacher: 'Prof. Michael Chen', subject: 'Physics', topic: 'Electromagnetic Induction', date: 'Dec 11' },
    { teacher: 'Dr. Sarah Mitchell', subject: 'Mathematics', topic: 'Calculus Fundamentals', date: 'Dec 12' },
    { teacher: 'Ms. Emily Rodriguez', subject: 'Chemistry', topic: 'Organic Chemistry', date: 'Dec 13' }
  ];

  const departmentOverview = [
    { subject: 'Mathematics', teachers: 3, students: 95, avgGrade: 'B+' },
    { subject: 'Physics', teachers: 2, students: 78, avgGrade: 'A-' },
    { subject: 'Chemistry', teachers: 2, students: 72, avgGrade: 'B+' },
    { subject: 'Computer Science', teachers: 3, students: 85, avgGrade: 'A' }
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">HOD Dashboard</h1>
              <p className="text-slate-600">Science Department Overview</p>
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
              {/* Pending Lesson Plan Approvals */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Pending Lesson Plan Approvals</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {pendingApprovals.map((item, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-slate-800">{item.teacher}</p>
                            <p className="text-slate-600 text-sm">{item.subject}</p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                            Pending
                          </span>
                        </div>
                        <p className="text-slate-700 mb-2">{item.topic}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-500 text-sm">Date: {item.date}</p>
                          <button 
                            onClick={() => navigate('/hod/lessons')}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Department Overview</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {departmentOverview.map((item, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg">
                        <h3 className="text-slate-800 mb-3">{item.subject}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Teachers</p>
                            <p className="text-slate-800">{item.teachers}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Students</p>
                            <p className="text-slate-800">{item.students}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Avg Grade</p>
                            <p className="text-slate-800">{item.avgGrade}</p>
                          </div>
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