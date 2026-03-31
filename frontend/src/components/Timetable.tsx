import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { timetableApi, studentsApi, type TimetableSlot, type StudentRecord } from '../services/api';

interface ClassOption {
  id: string;
  label: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [1, 2, 3, 4, 5, 6, 7, 8];

function classLabel(student: StudentRecord): string {
  if (student.classes?.name) return student.classes.name;
  if (student.classes?.grade && student.classes?.section) return `Grade ${student.classes.grade}-${student.classes.section}`;
  if (student.classes?.grade) return `Grade ${student.classes.grade}`;
  return 'Unassigned';
}

export default function Timetable() {
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const studentsResponse = await studentsApi.list('page=1&limit=400');
      const rows = studentsResponse.data ?? [];

      const map = new Map<string, string>();
      rows.forEach((student) => map.set(student.class_id, classLabel(student)));

      const options = Array.from(map.entries()).map(([id, label]) => ({ id, label }));
      setClassOptions(options);
      setSelectedClass((prev) => prev || options[0] || null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async (classId: string) => {
    try {
      const response = await timetableApi.byClass(classId);
      setSlots(response.data ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load timetable');
      setSlots([]);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass?.id) {
      loadTimetable(selectedClass.id);
    }
  }, [selectedClass?.id]);

  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots.forEach((slot) => {
      map.set(`${slot.day_of_week}-${slot.period_number}`, slot);
    });
    return map;
  }, [slots]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Weekly Timetable</h1>
              <p className="text-slate-600">View class schedules synced with backend</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex items-center justify-between gap-4">
              <div>
                <label className="block text-slate-700 mb-2">Select Class</label>
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => {
                    const next = classOptions.find((option) => option.id === e.target.value) || null;
                    setSelectedClass(next);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classOptions.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => selectedClass?.id && loadTimetable(selectedClass.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-slate-800">{selectedClass?.label || 'Class'} Schedule</h2>
                <p className="text-slate-600 text-sm mt-1">Weekly timetable from backend</p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading classes...</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="grid grid-cols-6 gap-px bg-slate-200 p-px">
                      <div className="bg-slate-50 p-4"><p className="text-slate-700">Period</p></div>
                      {days.map((day) => (
                        <div key={day} className="bg-slate-50 p-4 text-center"><p className="text-slate-700">{day}</p></div>
                      ))}

                      {periods.map((period) => (
                        <>
                          <div key={`period-${period}`} className="bg-white p-4"><p className="text-slate-600 text-sm">P{period}</p></div>
                          {days.map((day) => {
                            const slot = slotMap.get(`${day}-${period}`);
                            return (
                              <div key={`${day}-${period}`} className="bg-white p-2 min-h-24">
                                {slot ? (
                                  <div className="p-3 rounded-lg border h-full bg-blue-50 border-blue-200">
                                    <p className="text-slate-800 mb-1">{slot.subject}</p>
                                    <p className="text-xs text-slate-600">{slot.start_time} - {slot.end_time}</p>
                                    <p className="text-xs text-slate-500">Room: {slot.room || 'TBA'}</p>
                                  </div>
                                ) : (
                                  <div className="h-full border border-dashed border-slate-200 rounded-lg" />
                                )}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
