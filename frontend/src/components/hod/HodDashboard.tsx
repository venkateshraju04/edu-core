import { useEffect, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Users, Clock, ClipboardCheck, TrendingUp } from 'lucide-react';
import { getJwtClaims, lessonPlansApi, teachersApi } from '../../services/api';

export default function HodDashboard() {
  const claims = getJwtClaims();
  const [loading, setLoading] = useState(true);
  const [teacherCount, setTeacherCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [totalPlansThisWeek, setTotalPlansThisWeek] = useState(0);
  const [approvalRate, setApprovalRate] = useState(0);
  const [activities, setActivities] = useState<Array<{ text: string; time: string }>>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const departmentId = claims?.departmentId;
      if (!departmentId) {
        setActivities([{ text: 'No department assigned to this HOD account', time: 'Now' }]);
        return;
      }

      const [teachersResponse, plansResponse] = await Promise.all([
        teachersApi.byDepartment(departmentId),
        lessonPlansApi.list('page=1&limit=200'),
      ]);

      const teachers = teachersResponse.data ?? [];
      const teacherIds = new Set(teachers.map((teacher) => teacher.id));
      const plans = (plansResponse.data ?? []).filter((plan) => teacherIds.has(plan.teacher_id));

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const plansThisWeek = plans.filter((plan) => new Date(plan.date) >= weekAgo);

      const approved = plans.filter((plan) => plan.status === 'approved').length;
      const pending = plans.filter((plan) => plan.status === 'pending').length;
      const rate = plans.length ? Math.round((approved / plans.length) * 100) : 0;

      setTeacherCount(teachers.length);
      setPendingApprovals(pending);
      setTotalPlansThisWeek(plansThisWeek.length);
      setApprovalRate(rate);

      setActivities([
        {
          text: `${pending} lesson plans pending your review`,
          time: 'Live data',
        },
        {
          text: `${approved} lesson plans approved so far`,
          time: 'Live data',
        },
        {
          text: `${teachers.length} teachers active in your department`,
          time: 'Live data',
        },
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load HOD dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    {
      title: 'Teachers in Department',
      value: loading ? '...' : String(teacherCount),
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Approvals',
      value: loading ? '...' : String(pendingApprovals),
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Lesson Plans This Week',
      value: loading ? '...' : String(totalPlansThisWeek),
      icon: <ClipboardCheck className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Department Approval Rate',
      value: loading ? '...' : `${approvalRate}%`,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-purple-500'
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
              <h1 className="text-slate-800 mb-2">HOD Dashboard</h1>
              <p className="text-slate-600">Department management and oversight</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-slate-800">Department Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
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
        </main>
      </div>
    </div>
  );
}
