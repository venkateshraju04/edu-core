import Sidebar from '../Sidebar';
import Header from '../Header';
import { Users, TrendingUp, UserCheck, Award } from 'lucide-react';

export default function PrincipalDashboard() {
  const stats = [
    {
      title: 'Overall Attendance',
      value: '87%',
      icon: <UserCheck className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Average Student Grade',
      value: 'B+',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Teachers Present',
      value: '45/48',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Academic Awards',
      value: '12',
      icon: <Award className="w-8 h-8" />,
      color: 'bg-orange-500'
    }
  ];

  const performanceData = [
    { grade: 'Grade 8', average: 'B+', attendance: '89%', status: 'Good' },
    { grade: 'Grade 9', average: 'B', attendance: '85%', status: 'Average' },
    { grade: 'Grade 10', average: 'A-', attendance: '91%', status: 'Excellent' },
    { grade: 'Grade 11', average: 'B+', attendance: '87%', status: 'Good' },
    { grade: 'Grade 12', average: 'A', attendance: '93%', status: 'Excellent' }
  ];

  const recentActivities = [
    { text: 'Math Department submitted quarterly reports', time: '2 hours ago' },
    { text: 'Parent-teacher meeting scheduled for Dec 15', time: '5 hours ago' },
    { text: 'Annual sports day preparations completed', time: '1 day ago' },
    { text: 'New teacher orientation completed', time: '2 days ago' },
    { text: 'Grade 12 college counseling session held', time: '3 days ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-700';
      case 'Good': return 'bg-blue-100 text-blue-700';
      case 'Average': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

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
              {/* Grade Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-slate-800">Grade-wise Performance</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {performanceData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-slate-800">{item.grade}</p>
                          <p className="text-slate-600 text-sm mt-1">
                            Avg: {item.average} • Attendance: {item.attendance}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
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
