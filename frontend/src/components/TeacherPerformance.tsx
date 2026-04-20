import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Star, FileText } from 'lucide-react';
import { lessonPlansApi, teachersApi, type LessonPlanRecord, type TeacherRecord } from '../services/api';

interface TeacherView {
  id: string;
  name: string;
  subject: string;
  photo: string;
  attendance: 'Active' | 'Needs Attention';
  lessonPlan: 'Submitted' | 'Pending';
  rating: number;
  feedback: string;
}

function ratingFromPlans(plans: LessonPlanRecord[]): number {
  if (!plans.length) return 3.5;
  const approved = plans.filter((p) => p.status === 'approved').length;
  return Math.round((3 + (approved / plans.length) * 2) * 10) / 10;
}

function mapTeacher(teacher: TeacherRecord, plans: LessonPlanRecord[]): TeacherView {
  const approved = plans.filter((p) => p.status === 'approved').length;
  const pending = plans.filter((p) => p.status === 'pending').length;
  const latest = plans[0];

  return {
    id: teacher.id,
    name: teacher.users?.name || teacher.employee_id,
    subject: teacher.departments?.name || (teacher.subjects?.[0] || 'General'),
    photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(teacher.users?.name || teacher.id)}`,
    attendance: pending > approved ? 'Needs Attention' : 'Active',
    lessonPlan: pending > 0 ? 'Pending' : 'Submitted',
    rating: ratingFromPlans(plans),
    feedback: latest
      ? `Latest lesson topic: ${latest.topic}. Approved plans: ${approved}/${plans.length}.`
      : 'No lesson plans found yet.',
  };
}

export default function TeacherPerformance() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherView | null>(null);
  const [teachers, setTeachers] = useState<TeacherView[]>([]);

  const loadData = async () => {
    try {
      const teachersResponse = await teachersApi.list();
      let plans: LessonPlanRecord[] = [];

      try {
        const plansResponse = await lessonPlansApi.list('page=1&limit=1000');
        plans = plansResponse.data ?? [];
      } catch {
        plans = [];
      }

      const rows = (teachersResponse.data ?? []).map((teacher) => {
        const teacherPlans = plans.filter((plan) => plan.teacher_id === teacher.id);
        return mapTeacher(teacher, teacherPlans);
      });
      setTeachers(rows);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load teacher performance data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openFeedback = (teacher: TeacherView) => {
    setSelectedTeacher(teacher);
    setShowFeedback(true);
  };

  const averageRating = useMemo(() => {
    if (!teachers.length) return 0;
    return Math.round((teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length) * 10) / 10;
  }, [teachers]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-slate-800 mb-2">Teacher Performance</h1>
                <p className="text-slate-600">Monitor teacher lesson execution and activity health</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-right">
                <p className="text-slate-500 text-sm">Average Rating</p>
                <p className="text-slate-800">{averageRating}/5.0</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                    <div className="flex-1">
                      <h3 className="text-slate-800">{teacher.name}</h3>
                      <p className="text-slate-600">{teacher.subject}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Activity:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        teacher.attendance === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.attendance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Lesson Plans:</span>
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        teacher.lessonPlan === 'Submitted'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        <FileText className="w-3 h-3" />
                        {teacher.lessonPlan}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-slate-800">{teacher.rating}/5.0</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openFeedback(teacher)}
                    className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showFeedback && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-slate-800">Teacher Activity Insight</h2>
              <p className="text-slate-600 mt-1">{selectedTeacher.name} - {selectedTeacher.subject}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="p-2">
                      <Star
                        className={`w-8 h-8 ${
                          star <= Math.round(selectedTeacher.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Feedback Summary</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                  value={selectedTeacher.feedback}
                  readOnly
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
