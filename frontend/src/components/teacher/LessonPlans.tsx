import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { FileText, Calendar, CheckCircle, Clock, Plus, X as XIcon } from 'lucide-react';
import { useAuth } from '../../App';
import { getJwtClaims, lessonPlansApi, type LessonPlanRecord } from '../../services/api';

interface ClassOption {
  id: string;
  label: string;
}

export default function LessonPlans() {
  const { role } = useAuth();
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanRecord | null>(null);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanRecord[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);

  const [newPlan, setNewPlan] = useState({
    date: '',
    classId: '',
    subject: '',
    topic: '',
    objectives: '',
    materials: '',
    activities: '',
    assessment: ''
  });

  const claims = getJwtClaims();

  const loadPlans = async () => {
    try {
      const response = await lessonPlansApi.list('page=1&limit=200');
      const rows = response.data ?? [];
      setLessonPlans(rows);

      const map = new Map<string, string>();
      rows.forEach((row) => map.set(row.class_id, row.classes?.name || `Class ${row.class_id.slice(0, 8)}`));

      (claims?.classIds || []).forEach((classId) => {
        if (!map.has(classId)) {
          map.set(classId, `Class ${classId.slice(0, 8)}`);
        }
      });

      const options = Array.from(map.entries()).map(([id, label]) => ({ id, label }));
      setClassOptions(options);
      setNewPlan((prev) => ({ ...prev, classId: prev.classId || options[0]?.id || '' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load lesson plans');
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XIcon className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await lessonPlansApi.create({
        class_id: newPlan.classId,
        subject: newPlan.subject,
        date: newPlan.date,
        topic: newPlan.topic,
        objectives: newPlan.objectives,
        materials: newPlan.materials,
        activities: newPlan.activities,
        assessment: newPlan.assessment,
      });
      setShowNewPlan(false);
      setNewPlan({
        date: '',
        classId: classOptions[0]?.id || '',
        subject: '',
        topic: '',
        objectives: '',
        materials: '',
        activities: '',
        assessment: ''
      });
      await loadPlans();
      alert('Lesson plan submitted for review');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit lesson plan');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await lessonPlansApi.approve(id);
      await loadPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve lesson plan');
    }
  };

  const handleReject = async (id: string) => {
    const remarks = window.prompt('Enter rejection remarks') || '';
    if (!remarks.trim()) return;

    try {
      await lessonPlansApi.reject(id, remarks);
      await loadPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject lesson plan');
    }
  };

  const isHOD = role === 'hod';

  const filteredPlans = useMemo(
    () => lessonPlans.filter((plan) => (isHOD ? plan.status === 'pending' : true)),
    [lessonPlans, isHOD],
  );

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-slate-800 mb-2">Lesson Plans</h1>
                <p className="text-slate-600">Create and manage your lesson plans</p>
              </div>
              {role === 'teacher' && (
                <button onClick={() => setShowNewPlan(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">
                  <Plus className="w-5 h-5" />
                  New Lesson Plan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">{getStatusIcon(plan.status)}</div>
                      <div>
                        <h3 className="text-slate-800 mb-1">{plan.topic}</h3>
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(plan.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-slate-600">Class: {plan.classes?.name || plan.class_id.slice(0, 8)}</p>
                    <p className="text-slate-600">Subject: {plan.subject}</p>
                    <p className="text-slate-600">Teacher: {plan.teachers?.users?.name || '-'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(plan.status)}`}>{plan.status}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm" onClick={() => setSelectedPlan(plan)}>
                      View Details
                    </button>
                  </div>

                  {isHOD && plan.status === 'pending' && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <button onClick={() => handleApprove(plan.id)} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition">Approve</button>
                      <button onClick={() => handleReject(plan.id)} className="bg-red-600 text-white px-3 py-1 rounded-full text-sm hover:bg-red-700 transition">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showNewPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-slate-800">Create New Lesson Plan</h2>
              <p className="text-slate-600 mt-1">Fill in the details for your lesson</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Date</label>
                  <input type="date" required value={newPlan.date} onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Class</label>
                  <select value={newPlan.classId} onChange={(e) => setNewPlan({ ...newPlan, classId: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                    {classOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Subject</label>
                <input type="text" required value={newPlan.subject} onChange={(e) => setNewPlan({ ...newPlan, subject: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Lesson Topic</label>
                <input type="text" required value={newPlan.topic} onChange={(e) => setNewPlan({ ...newPlan, topic: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Learning Objectives</label>
                <textarea required rows={3} value={newPlan.objectives} onChange={(e) => setNewPlan({ ...newPlan, objectives: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Materials Needed</label>
                <textarea rows={3} value={newPlan.materials} onChange={(e) => setNewPlan({ ...newPlan, materials: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Teaching Activities</label>
                <textarea required rows={4} value={newPlan.activities} onChange={(e) => setNewPlan({ ...newPlan, activities: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Assessment Method</label>
                <textarea rows={3} value={newPlan.assessment} onChange={(e) => setNewPlan({ ...newPlan, assessment: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowNewPlan(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">Submit Lesson Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-slate-800">Lesson Plan Details</h2>
              <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <XIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-slate-700">
              <p><strong>Topic:</strong> {selectedPlan.topic}</p>
              <p><strong>Date:</strong> {new Date(selectedPlan.date).toLocaleDateString()}</p>
              <p><strong>Class:</strong> {selectedPlan.classes?.name || selectedPlan.class_id}</p>
              <p><strong>Subject:</strong> {selectedPlan.subject}</p>
              <p><strong>Objectives:</strong> {selectedPlan.objectives}</p>
              <p><strong>Materials:</strong> {selectedPlan.materials || '-'}</p>
              <p><strong>Activities:</strong> {selectedPlan.activities}</p>
              <p><strong>Assessment:</strong> {selectedPlan.assessment || '-'}</p>
              {selectedPlan.hod_remarks && <p><strong>HOD Remarks:</strong> {selectedPlan.hod_remarks}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
