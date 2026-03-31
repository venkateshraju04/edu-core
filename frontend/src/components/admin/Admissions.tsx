import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { X as XIcon, Plus, UserPlus } from 'lucide-react';
import { admissionsApi, studentsApi, type AdmissionRecord, type StudentRecord } from '../../services/api';

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  if (student.classes?.grade) return `Grade ${student.classes.grade}`;
  return 'Unassigned';
}

export default function Admissions() {
  const [showNewAdmissionForm, setShowNewAdmissionForm] = useState(false);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classSelectionByAdmission, setClassSelectionByAdmission] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    grade: '',
    gender: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    previousSchool: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [admissionsResponse, studentsResponse] = await Promise.all([
        admissionsApi.list('page=1&limit=200'),
        studentsApi.list('page=1&limit=200'),
      ]);
      setAdmissions(admissionsResponse.data ?? []);
      setStudents(studentsResponse.data ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => map.set(student.class_id, classLabel(student)));
    return Array.from(map.entries());
  }, [students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await admissionsApi.create({
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        grade_applying: Number(formData.grade),
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_phone: formData.parentPhone,
        address: formData.address,
        previous_school: formData.previousSchool,
      });

      alert('New admission submitted successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        grade: '',
        gender: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        address: '',
        previousSchool: ''
      });
      setShowNewAdmissionForm(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit admission');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApprove = async (admissionId: string) => {
    try {
      const classId = classSelectionByAdmission[admissionId] || classOptions[0]?.[0];
      if (!classId) {
        alert('No class is available for assignment.');
        return;
      }

      await admissionsApi.approve(admissionId, classId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve admission');
    }
  };

  const handleReject = async (admissionId: string) => {
    try {
      await admissionsApi.reject(admissionId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject admission');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-slate-800 mb-2">Admissions</h1>
                <p className="text-slate-600">Manage student admissions</p>
              </div>
              <button
                onClick={() => setShowNewAdmissionForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Admission
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-slate-800">Admission Requests</h2>
                <button
                  onClick={loadData}
                  className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  Refresh
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-slate-500 text-center py-8">Loading admissions...</p>
                  ) : admissions.map((admission) => (
                    <div key={admission.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-slate-800">{admission.first_name} {admission.last_name}</p>
                          <p className="text-slate-600 text-sm">
                            Grade {admission.grade_applying} • DOB: {new Date(admission.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          admission.status === 'approved' ? 'bg-green-100 text-green-700' :
                          admission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {admission.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                        <p>Parent: {admission.parent_name}</p>
                        <p>Phone: {admission.parent_phone}</p>
                        <p className="col-span-2">Email: {admission.parent_email || '-'}</p>
                      </div>
                      {admission.status === 'pending' && (
                        <div className="flex gap-2 items-center">
                          <select
                            value={classSelectionByAdmission[admission.id] || classOptions[0]?.[0] || ''}
                            onChange={(e) => setClassSelectionByAdmission((prev) => ({ ...prev, [admission.id]: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                          >
                            {classOptions.map(([id, label]) => (
                              <option key={id} value={id}>{label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleApprove(admission.id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(admission.id)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showNewAdmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-slate-800">New Student Admission</h2>
                <p className="text-slate-600 text-sm">Fill in the student details</p>
              </div>
              <button
                onClick={() => setShowNewAdmissionForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <XIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-slate-800">Student Information</h2>
                    <p className="text-slate-600 text-sm">Fill in the details below</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                      <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">First Name</label>
                    </div>

                    <div className="relative">
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                      <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">Last Name</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <label className="block text-xs text-slate-600 mb-1">Date of Birth</label>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Grade</label>
                    <select name="grade" value={formData.grade} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                      <option value="">Select Grade</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-slate-800 mb-4">Parent/Guardian Information</h3>

                    <div className="space-y-4">
                      <div className="relative">
                        <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                        <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">Parent/Guardian Name</label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                          <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">Email Address</label>
                        </div>

                        <div className="relative">
                          <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                          <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">Phone Number</label>
                        </div>
                      </div>

                      <div className="relative">
                        <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                        <label className="absolute left-4 top-2 text-xs text-slate-600">Home Address</label>
                      </div>

                      <div className="relative">
                        <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="peer w-full px-4 pt-6 pb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder=" " />
                        <label className="absolute left-4 top-2 text-xs text-slate-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">Previous School (Optional)</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowNewAdmissionForm(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                      Submit Admission
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
