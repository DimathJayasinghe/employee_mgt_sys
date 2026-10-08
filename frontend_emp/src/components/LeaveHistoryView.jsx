import React, { useState, useEffect } from 'react';
import API from '../api';
import { ClipboardList, Plus, Ban, AlertTriangle, CheckCircle2, X, Clock } from 'lucide-react';
import { getLeaveCancellationStatus } from '../utils/leaveUtils';

export default function LeaveHistoryView({ userId, onOpenApplyLeave, onLeaveCancelled }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (userId) fetchLeaveHistory();
  }, [userId]);

  const fetchLeaveHistory = async () => {
    try {
      const res = await API.get(`/leave/history?user_id=${userId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.requests || res.data?.leaves || []);
      setLeaves(list);
    } catch (err) {
      console.error('Failed to fetch leave history:', err);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      const res = await API.post('/leave/cancel', { id: cancelTarget.id, user_id: userId });
      const msg = res.data?.message || 'Leave cancelled successfully';
      setToastMsg({ type: 'success', text: msg });
      setTimeout(() => setToastMsg(null), 4000);
      setCancelTarget(null);
      await fetchLeaveHistory();
      if (onLeaveCancelled) {
        onLeaveCancelled();
      }
    } catch (err) {
      const errorText = err.response?.data?.error || err.message || 'Failed to cancel leave request';
      setToastMsg({ type: 'error', text: errorText });
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Leave History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your submitted leave requests and approval status.</p>
        </div>
        <button
          onClick={onOpenApplyLeave}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Loading leave history...</div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No leave history found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Days</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leaves.map((leave) => {
                const isSpecial = leave.leave_type === 'Special Leave';
                const isShortLeave = leave.leave_type === 'Short Leave';
                const isPowerCut = leave.leave_type === 'Power Cut';
                const sDate = leave.start_date ? leave.start_date.split('T')[0] : '';
                const eDate = leave.end_date ? leave.end_date.split('T')[0] : '';
                const durationText = isSpecial && leave.day_of_week
                  ? leave.day_of_week.split(',').map(p => {
                      const t = p.trim();
                      if (t.includes(':')) { const [d, s] = t.split(':'); return `${d.slice(0,3)} (${s})`; }
                      return t;
                    }).join(', ') + ` starting ${sDate}`
                  : isShortLeave && leave.start_time && leave.end_time
                  ? `${sDate} (${leave.start_time.slice(0,5)} - ${leave.end_time.slice(0,5)})`
                  : (sDate === eDate ? sDate : `${sDate} to ${eDate}`);

                const cancelStatus = getLeaveCancellationStatus(leave);

                return (
                  <tr key={leave.id || Math.random()} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {isSpecial ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          🔄 Special Leave
                        </span>
                      ) : isShortLeave ? (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          ⏱️ Short Leave
                        </span>
                      ) : isPowerCut ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          ⚡ Power Cut
                        </span>
                      ) : leave.leave_type}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{durationText}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {isSpecial && leave.day_of_week ? `Every ${leave.day_of_week}` : isShortLeave ? `${leave.days_count} day` : leave.days_count}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{leave.reason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                          : leave.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                          : leave.status === 'Cancelled'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200/80'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cancelStatus.canCancel ? (
                        <div className="inline-flex flex-col items-center">
                          <button
                            onClick={() => setCancelTarget(leave)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title={`Cancel this leave request (Allowed ${cancelStatus.deadlineText})`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : cancelStatus.isExpired ? (
                        <div className="inline-flex flex-col items-center group relative" title={cancelStatus.reason}>
                          <span className="bg-slate-100 text-slate-400 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1 cursor-not-allowed">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Passed</span>
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-medium">After start time</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cancel Leave Request</h3>
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel this leave application?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Leave Type:</span>
                  <span className="font-bold text-slate-800">{cancelTarget.leave_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date / Period:</span>
                  <span className="font-semibold text-slate-800">
                    {cancelTarget.start_date === cancelTarget.end_date 
                      ? cancelTarget.start_date 
                      : `${cancelTarget.start_date} → ${cancelTarget.end_date}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days / Duration:</span>
                  <span className="font-semibold text-slate-800">{cancelTarget.days_count} day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={`font-bold ${cancelTarget.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cancelTarget.status}
                  </span>
                </div>
              </div>

              {cancelTarget.status === 'Approved' ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-3 rounded-xl font-medium leading-relaxed">
                  💡 <strong>Leave Quota Refund:</strong> Since this leave was approved, <strong>{cancelTarget.days_count} day(s)</strong> will be automatically credited back to your available leave balance immediately upon cancellation.
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-3 rounded-xl font-medium leading-relaxed">
                  ℹ️ This pending leave request will be marked as Cancelled and removed from admin review.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Keep Leave
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
