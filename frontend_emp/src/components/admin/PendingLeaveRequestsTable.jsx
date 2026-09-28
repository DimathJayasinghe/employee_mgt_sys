import React, { useState } from 'react';
import { ArrowUpRight, Eye, CheckCircle2, XCircle } from 'lucide-react';

export default function PendingLeaveRequestsTable({ requests = [], onApprove, onReject, onViewAll }) {
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleApproveClick = async (id, name) => {
    await onApprove(id);
    setActionSuccess(`Approved leave request for ${name}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRejectClick = async (id, name) => {
    await onReject(id);
    setActionSuccess(`Rejected leave request for ${name}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-8 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Pending Leave Requests</h3>
          <p className="text-xs text-slate-500 mt-0.5">Requests requiring your review</p>
        </div>

        <div className="flex items-center gap-3">
          {actionSuccess && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
              {actionSuccess}
            </span>
          )}

          <button
            onClick={onViewAll}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Leave type</th>
              <th className="px-6 py-3.5">From</th>
              <th className="px-6 py-3.5">To</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Reason</th>
              <th className="px-6 py-3.5">Applied</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-medium">
                  No pending leave requests to review.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{req.employee_name}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">
                    {req.leave_type === 'Special Leave' ? (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        🔄 Special Leave
                      </span>
                    ) : req.leave_type === 'Short Leave' ? (
                      <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        ⏱️ Short Leave
                      </span>
                    ) : req.leave_type === 'Power Cut' ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                        ⚡ Power Cut
                      </span>
                    ) : req.leave_type}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{req.from_date}</td>
                  <td className="px-6 py-4 text-slate-600">{req.to_date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{req.duration}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-6 py-4 text-slate-400 text-[11px]">{req.applied_date}</td>
                  <td className="px-6 py-4">
                    <span className="bg-amber-50 text-amber-600 border border-amber-200/80 text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleApproveClick(req.id, req.employee_name)}
                        className="bg-[#07162c] hover:bg-[#0d274c] text-white text-xs font-bold px-3 py-1 rounded-lg transition-all shadow-2xs cursor-pointer"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleRejectClick(req.id, req.employee_name)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        title="View Details"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
