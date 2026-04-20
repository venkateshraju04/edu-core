import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { DollarSign, Users, UserCheck, AlertCircle } from 'lucide-react';
import { admissionsApi, feesApi, studentsApi, teachersApi } from '../../services/api';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [pendingAdmissions, setPendingAdmissions] = useState(0);
  const [feesCollected, setFeesCollected] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [recentAdmissions, setRecentAdmissions] = useState<Array<{ text: string; time: string }>>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [studentsResponse, teachersResponse, admissionsResponse, summaryResponse] = await Promise.all([
        studentsApi.list('page=1&limit=1'),
        teachersApi.list(),
        admissionsApi.list('status=pending&page=1&limit=5'),
        feesApi.summary(),
      ]);

      setTotalStudents(studentsResponse.meta?.total ?? (studentsResponse.data?.length || 0));
      setTotalTeachers(teachersResponse.meta?.total ?? (teachersResponse.data?.length || 0));
      setPendingAdmissions(admissionsResponse.meta?.total ?? (admissionsResponse.data?.length || 0));
      setFeesCollected(Number(summaryResponse.data?.totalPaid || 0));
      setUnpaidCount(Number(summaryResponse.data?.unpaidCount || 0));

      const updates = (admissionsResponse.data ?? []).map((admission) => ({
        text: `${admission.first_name} ${admission.last_name} applied for Grade ${admission.grade_applying}`,
        time: new Date(admission.date_of_birth).toLocaleDateString(),
      }));
      setRecentAdmissions(updates);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      title: 'Total Students',
      value: loading ? '...' : totalStudents.toLocaleString(),
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Fees Collected',
      value: loading ? '...' : `$${feesCollected.toLocaleString()}`,
      icon: <DollarSign className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Active Teachers',
      value: loading ? '...' : totalTeachers.toString(),
      icon: <UserCheck className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Alerts',
      value: loading ? '...' : `${pendingAdmissions + unpaidCount} Due`,
      icon: <AlertCircle className="w-8 h-8" />,
      color: 'bg-red-500'
    }
  ];

  const recentUpdates = useMemo(() => {
    if (recentAdmissions.length > 0) return recentAdmissions;
    return [
      { text: 'No new pending admissions right now', time: 'Today' },
      { text: `${unpaidCount} students currently have unpaid fees`, time: 'Live summary' },
    ];
  }, [recentAdmissions, unpaidCount]);

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
