import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Printer, Edit2, X } from 'lucide-react';
import { feesApi, type FeeRecord } from '../../services/api';

interface UiFee {
  id: string;
  studentId: string;
  name: string;
  className: string;
  amountDue: number;
  totalFees: number;
  amountPaid: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
}

function mapFeeRow(row: FeeRecord): UiFee {
  const status = row.status === 'paid' ? 'Paid' : row.status === 'partial' ? 'Partial' : 'Unpaid';
  const name = `${row.students?.first_name || ''} ${row.students?.last_name || ''}`.trim() || row.student_id;

  return {
    id: row.id,
    studentId: row.student_id,
    name,
    className: row.students?.classes?.name || row.students?.class_id || 'Unknown',
    amountDue: Number(row.amount_due) - Number(row.amount_paid),
    totalFees: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
    status,
  };
}

export default function FeesManagement() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<UiFee | null>(null);
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [fees, setFees] = useState<UiFee[]>([]);
  const [receiptText, setReceiptText] = useState('');

  const [updateAmount, setUpdateAmount] = useState(0);

  const loadFees = async () => {
    try {
      const response = await feesApi.list('page=1&limit=500');
      setFees((response.data ?? []).map(mapFeeRow));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load fees');
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const overdueStudents = fees.filter((s) => s.status === 'Unpaid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const openReceipt = async (fee: UiFee) => {
    setSelectedFee(fee);
    setShowReceipt(true);

    try {
      const response = await feesApi.receipt(fee.id);
      setReceiptText(response.data?.receiptText || 'Receipt details unavailable.');
    } catch (err) {
      setReceiptText(err instanceof Error ? err.message : 'Failed to fetch receipt');
    }
  };

  const openUpdateModal = (fee: UiFee) => {
    setSelectedFee(fee);
    setUpdateAmount(fee.amountPaid);
    setShowUpdateModal(true);
  };

  const handleUpdateFees = async () => {
    if (!selectedFee) return;

    try {
      await feesApi.update(selectedFee.id, updateAmount);
      setShowUpdateModal(false);
      await loadFees();
      alert('Fees updated successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update fees');
    }
  };

  const filteredStudents = useMemo(
    () => fees.filter((student) => {
      const classMatch = filterClass === 'All Classes' || student.className === filterClass;
      const statusMatch = filterStatus === 'All Status' || student.status === filterStatus;
      return classMatch && statusMatch;
    }),
    [fees, filterClass, filterStatus],
  );

  const allClasses = ['All Classes', ...Array.from(new Set(fees.map((s) => s.className)))];
  const allStatuses = ['All Status', 'Paid', 'Partial', 'Unpaid'];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Fees Management</h1>
              <p className="text-slate-600">Track and manage student fee payments</p>
            </div>

            {overdueStudents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <h3 className="text-red-800 mb-3">Overdue Payments Alert</h3>
                <div className="flex flex-wrap gap-2">
                  {overdueStudents.map((student) => (
                    <span key={student.id} className="bg-white text-red-700 px-3 py-1 rounded-full text-sm border border-red-200">
                      {student.name} ({student.className}) - ${student.amountDue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-slate-800 mb-4">Filters</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Filter by Class</label>
                  <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                    {allClasses.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-2">Filter by Payment Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-slate-700">Student ID</th>
                      <th className="px-6 py-4 text-left text-slate-700">Name</th>
                      <th className="px-6 py-4 text-left text-slate-700">Class</th>
                      <th className="px-6 py-4 text-left text-slate-700">Amount Due</th>
                      <th className="px-6 py-4 text-left text-slate-700">Status</th>
                      <th className="px-6 py-4 text-left text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-slate-800">{student.studentId.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-slate-800">{student.name}</td>
                        <td className="px-6 py-4 text-slate-600">{student.className}</td>
                        <td className="px-6 py-4 text-slate-800">${student.amountDue}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(student.status)}`}>{student.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {(student.status === 'Paid' || student.status === 'Partial') && (
                              <button onClick={() => openReceipt(student)} className="p-2 hover:bg-slate-100 rounded-lg transition" title="Print Receipt">
                                <Printer className="w-5 h-5 text-slate-600" />
                              </button>
                            )}
                            <button onClick={() => openUpdateModal(student)} className="p-2 hover:bg-slate-100 rounded-lg transition" title="Update Fees">
                              <Edit2 className="w-5 h-5 text-slate-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showReceipt && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-slate-800">Fee Receipt</h2>
              <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <pre className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">{receiptText}</pre>

              <button onClick={() => window.print()} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-slate-800">Update Fees</h2>
              <button onClick={() => setShowUpdateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="border-t border-b border-slate-200 py-4 space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-slate-600">Student:</span><span className="text-slate-800">{selectedFee.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Total Fees:</span><span className="text-slate-800">${selectedFee.totalFees}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Current Paid:</span><span className="text-slate-800">${selectedFee.amountPaid}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Update Paid Amount:</span>
                  <input type="number" min={0} max={selectedFee.totalFees} value={updateAmount} onChange={(e) => setUpdateAmount(Number(e.target.value))} className="border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
              </div>

              <button onClick={handleUpdateFees} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Edit2 className="w-5 h-5" />
                Update Fees
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
