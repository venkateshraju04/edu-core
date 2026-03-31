import { useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Star, X } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  photo: string;
  rating: number;
  feedback: string;
}

export default function TeacherEvaluation() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const teachers: Teacher[] = [
    {
      id: 'T001',
      name: 'Dr. Sarah Mitchell',
      subject: 'Mathematics',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      rating: 4.8,
      feedback: 'Excellent teaching methods and student engagement. Consistently submits lesson plans on time.'
    },
    {
      id: 'T002',
      name: 'Prof. Michael Chen',
      subject: 'Physics',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      rating: 4.5,
      feedback: 'Strong subject knowledge. Good classroom management skills.'
    },
    {
      id: 'T003',
      name: 'Ms. Emily Rodriguez',
      subject: 'English Literature',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      rating: 4.9,
      feedback: 'Outstanding educator. Creates engaging lesson plans and maintains excellent rapport with students.'
    },
    {
      id: 'T004',
      name: 'Mr. James Anderson',
      subject: 'Chemistry',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
      rating: 4.6,
      feedback: 'Organized and methodical approach to teaching. Lab sessions are well-structured.'
    },
    {
      id: 'T005',
      name: 'Dr. Lisa Thompson',
      subject: 'Biology',
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80',
      rating: 4.7,
      feedback: 'Innovative teaching techniques. Regularly updates curriculum with current research.'
    },
    {
      id: 'T006',
      name: 'Prof. David Kim',
      subject: 'History',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
      rating: 4.4,
      feedback: 'Makes history engaging through storytelling. Could improve on assignment feedback timing.'
    }
  ];

  const openEvaluation = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setRating(teacher.rating);
    setFeedback(teacher.feedback);
    setShowEvaluationForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Evaluation saved for ${selectedTeacher?.name}`);
    setShowEvaluationForm(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Teacher Evaluation</h1>
              <p className="text-slate-600">Review and evaluate teacher performance</p>
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
                                star <= teacher.rating
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

      {/* Evaluation Form Modal */}
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
                  This evaluation form is only editable on the Principal's dashboard. Your ratings and feedback help improve teaching quality.
                </p>
              </div>

              {/* Star Rating */}
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

              {/* Evaluation Criteria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Teaching Methodology</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Average</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Student Engagement</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Average</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Classroom Management</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Average</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2">Professionalism</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Average</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>
              </div>

              {/* Principal's Feedback */}
              <div>
                <label className="block text-slate-700 mb-2">Principal&apos;s Feedback</label>
                <textarea
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed feedback on the teacher's performance, strengths, and areas for improvement..."
                ></textarea>
              </div>

              {/* Action Items */}
              <div>
                <label className="block text-slate-700 mb-2">Action Items / Recommendations</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List specific action items or recommendations for improvement..."
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
