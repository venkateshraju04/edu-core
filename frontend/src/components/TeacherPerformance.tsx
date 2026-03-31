import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Star, FileText } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  photo: string;
  attendance: 'Present' | 'Absent';
  lessonPlan: 'Submitted' | 'Pending';
  rating: number;
}

export default function TeacherPerformance() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const teachers: Teacher[] = [
    {
      id: 'T001',
      name: 'Dr. Sarah Mitchell',
      subject: 'Mathematics',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      attendance: 'Present',
      lessonPlan: 'Submitted',
      rating: 4.8
    },
    {
      id: 'T002',
      name: 'Prof. Michael Chen',
      subject: 'Physics',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      attendance: 'Present',
      lessonPlan: 'Submitted',
      rating: 4.5
    },
    {
      id: 'T003',
      name: 'Ms. Emily Rodriguez',
      subject: 'English Literature',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      attendance: 'Present',
      lessonPlan: 'Pending',
      rating: 4.9
    },
    {
      id: 'T004',
      name: 'Mr. James Anderson',
      subject: 'Chemistry',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
      attendance: 'Absent',
      lessonPlan: 'Submitted',
      rating: 4.6
    },
    {
      id: 'T005',
      name: 'Dr. Lisa Thompson',
      subject: 'Biology',
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80',
      attendance: 'Present',
      lessonPlan: 'Submitted',
      rating: 4.7
    },
    {
      id: 'T006',
      name: 'Prof. David Kim',
      subject: 'History',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
      attendance: 'Present',
      lessonPlan: 'Submitted',
      rating: 4.4
    }
  ];

  const openFeedback = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowFeedback(true);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Teacher Performance</h1>
              <p className="text-slate-600">Monitor and review teacher activities</p>
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
                      <span className="text-slate-600">Attendance:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        teacher.attendance === 'Present' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.attendance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Lesson Plan:</span>
                      <button className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        teacher.lessonPlan === 'Submitted'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}>
                        <FileText className="w-3 h-3" />
                        {teacher.lessonPlan}
                      </button>
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

      {/* Feedback Modal */}
      {showFeedback && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-slate-800">Teacher Feedback</h2>
              <p className="text-slate-600 mt-1">{selectedTeacher.name} - {selectedTeacher.subject}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-2 hover:bg-slate-100 rounded transition"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= selectedTeacher.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Feedback Comments</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your feedback and observations..."
                  defaultValue="Excellent teaching methods and student engagement. Consistently submits lesson plans on time."
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
