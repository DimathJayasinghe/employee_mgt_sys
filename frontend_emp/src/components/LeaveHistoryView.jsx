import React, { useState, useEffect } from 'react';
import API from '../api';
import { ClipboardList, Plus } from 'lucide-react';

export default function LeaveHistoryView({ userId, onOpenApplyLeave }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                    <td className="px-6 py-4 text-slate-700 font-semibold">{isSpecial && leave.day_of_week ? `Every ${leave.day_of_week}` : isShortLeave ? `${leave.days_count} day` : leave.days_count}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{leave.reason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                          : leave.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                          : 'bg-rose-50 text-rose-600 border-rose-200/80'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
