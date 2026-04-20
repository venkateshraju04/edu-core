import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Star, X } from 'lucide-react';
import { lessonPlansApi, teachersApi, type LessonPlanRecord, type TeacherRecord } from '../../services/api';

interface TeacherView {
  id: string;
  name: string;
  subject: string;
  photo: string;
  rating: number;
  feedback: string;
}

interface LocalEvaluation {
  rating: number;
  feedback: string;
}

const LOCAL_KEY = 'principal.teacherEvaluations.v1';

function loadLocalEvaluations(): Record<string, LocalEvaluation> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LocalEvaluation>;
  } catch {
    return {};
  }
}

function saveLocalEvaluations(data: Record<string, LocalEvaluation>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function scoreFromPlans(plans: LessonPlanRecord[]): number {
  if (!plans.length) return 3.5;
  const approved = plans.filter((plan) => plan.status === 'approved').length;
  const pending = plans.filter((plan) => plan.status === 'pending').length;
  const rejected = plans.filter((plan) => plan.status === 'rejected').length;
  const ratio = approved / plans.length;
  const base = 3 + ratio * 2;
  const penalty = pending * 0.03 + rejected * 0.08;
  const score = Math.max(1, Math.min(5, base - penalty));
  return Math.round(score * 10) / 10;
}

function toTeacherView(
  teacher: TeacherRecord,
  plans: LessonPlanRecord[],
  local: Record<string, LocalEvaluation>,
): TeacherView {
  const localValue = local[teacher.id];
  const computedRating = scoreFromPlans(plans);
  const defaultFeedback = plans.length
    ? `${plans.filter((p) => p.status === 'approved').length}/${plans.length} lesson plans approved.`
    : 'No lesson plan activity found yet.';

  return {
    id: teacher.id,
    name: teacher.users?.name || 'Unknown Teacher',
    subject: teacher.departments?.name || 'General',
    photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(teacher.users?.name || teacher.id)}`,
    rating: localValue?.rating || computedRating,
    feedback: localValue?.feedback || defaultFeedback,
  };
}

export default function TeacherEvaluation() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherView | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [teachers, setTeachers] = useState<TeacherView[]>([]);

  const openEvaluation = (teacher: TeacherView) => {
    setSelectedTeacher(teacher);
    setRating(teacher.rating);
    setFeedback(teacher.feedback);
    setShowEvaluationForm(true);
  };

  const loadTeachers = async () => {
    try {
      const local = loadLocalEvaluations();
      const [teachersResponse, plansResponse] = await Promise.all([
        teachersApi.list(),
        lessonPlansApi.list('page=1&limit=1000'),
      ]);

      const teacherRows = teachersResponse.data ?? [];
      const allPlans = plansResponse.data ?? [];

      const rows = teacherRows.map((teacher) => {
        const plans = allPlans.filter((plan) => plan.teacher_id === teacher.id);
        return toTeacherView(teacher, plans, local);
      });

      setTeachers(rows);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load teacher evaluation data');
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const averageRating = useMemo(() => {
    if (teachers.length === 0) return 0;
    return Math.round((teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length) * 10) / 10;
  }, [teachers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const local = loadLocalEvaluations();
    local[selectedTeacher.id] = { rating, feedback };
    saveLocalEvaluations(local);

    setTeachers((current) =>
      current.map((teacher) =>
        teacher.id === selectedTeacher.id ? { ...teacher, rating, feedback } : teacher,
      ),
    );
    setShowEvaluationForm(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-slate-800 mb-2">Teacher Evaluation</h1>
                <p className="text-slate-600">Review teacher performance using live activity data</p>
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
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
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

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-700">Current Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(teacher.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="text-slate-700 ml-1">{teacher.rating}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2">{teacher.feedback}</p>
                    </div>

                    <button
                      onClick={() => openEvaluation(teacher)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Update Evaluation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showEvaluationForm && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-slate-800">Teacher Evaluation Form</h2>
                <p className="text-slate-600 mt-1">{selectedTeacher.name} - {selectedTeacher.subject}</p>
              </div>
              <button
                onClick={() => setShowEvaluationForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Evaluations are persisted locally in this browser because no principal evaluation write API exists yet.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-3">Overall Performance Rating</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-2 hover:bg-slate-100 rounded transition"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-slate-700 ml-2">{rating}/5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Principal Feedback</label>
                <textarea
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed feedback on strengths and areas for improvement..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEvaluationForm(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
