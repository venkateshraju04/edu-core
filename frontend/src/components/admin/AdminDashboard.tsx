import Sidebar from '../Sidebar';
import Header from '../Header';
import { DollarSign, Users, UserCheck, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Students',
      value: '1,200',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Fees Collected',
      value: '$50,000',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Teachers Present',
      value: '45/48',
      icon: <UserCheck className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Alerts',
      value: '5 Due',
      icon: <AlertCircle className="w-8 h-8" />,
      color: 'bg-red-500'
    }
  ];

  const recentUpdates = [
    { text: 'John Doe paid fees for Quarter 2', time: '10 mins ago' },
    { text: 'New admission: Sarah Johnson (Grade 9)', time: '1 hour ago' },
    { text: 'Teacher Meeting scheduled for Dec 15', time: '2 hours ago' },
    { text: 'Report cards generated for Grade 10', time: '3 hours ago' },
    { text: 'Library books updated in system', time: '5 hours ago' }
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Dashboard Overview</h1>
              <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
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

            {/* Recent Updates */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-slate-800">Recent Updates</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-slate-800">{update.text}</p>
                        <p className="text-slate-500 text-sm mt-1">{update.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
