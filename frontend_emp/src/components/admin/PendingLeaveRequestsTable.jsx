import React, { useState } from 'react';
import { ArrowUpRight, Eye, CheckCircle2, XCircle } from 'lucide-react';

export default function PendingLeaveRequestsTable({ requests = [], currentUser, onApprove, onReject, onViewAll }) {
  const [actionSuccess, setActionSuccess] = useState(null);

  const seniorAdminEmails = [
    'channa@pwholdings.lk',
    'nishani@pwholdings.lk',
    'hashan@pwholdings.lk',
    'pasindu.buddhima@pwholdings.lk'
  ];
  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const isAuthorizedSeniorAdmin = currentUser?.role === 'Admin' && (
    Boolean(currentUser?.is_senior_admin) ||
    seniorAdminEmails.includes(userEmail) ||
    (currentUser?.designation && (
      currentUser.designation.toLowerCase().includes('director') ||
      currentUser.designation.toLowerCase().includes('lead') ||
      currentUser.designation.toLowerCase().includes('manager')
    ))
  );

  const handleApproveClick = async (req) => {
    try {
      await onApprove(req.id);
      setActionSuccess(`Approved leave request for ${req.employee_name || 'employee'}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Approve failed:', err);
    }
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
              requests.map((req) => {
                const isExceeded = req.is_exceeded_balance || (req.user_available_balance !== undefined && req.user_available_balance <= 0);

                return (
                  <tr 
                    key={req.id} 
                    className={`${isExceeded ? 'bg-red-50/70 hover:bg-red-100/60 border-l-4 border-l-red-500' : 'hover:bg-slate-50/60'} transition-colors`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 overflow-hidden shadow-2xs">
                          {req.photo_url ? (
                            <img src={req.photo_url} alt={req.employee_name} className="w-full h-full object-cover" />
                          ) : (
                            req.initials || (req.employee_name ? req.employee_name.slice(0, 2).toUpperCase() : 'EP')
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-slate-900 font-extrabold">{req.employee_name}</div>
                          {req.department && <div className="text-[10px] text-slate-400 font-medium truncate">{req.department}</div>}
                        </div>
                      </div>
                      {isExceeded && (
                        <div className="mt-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs ${
                            isAuthorizedSeniorAdmin 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            ⚠️ Over-Quota ({req.user_available_balance ?? 0} Bal)
                            {!isAuthorizedSeniorAdmin && ' • Senior Admin Approval Required'}
                          </span>
                        </div>
                      )}
                    </td>
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
                    <td className="px-6 py-4 text-slate-600 max-w-sm whitespace-pre-wrap break-words text-xs leading-relaxed">{req.reason || '-'}</td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">{req.applied_date}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${isExceeded ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-50 text-amber-600 border border-amber-200/80'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApproveClick(req)}
                          className={`${
                            isExceeded && !isAuthorizedSeniorAdmin
                              ? 'bg-slate-300 text-slate-600 cursor-not-allowed border border-slate-400/50'
                              : 'bg-[#07162c] hover:bg-[#0d274c] text-white cursor-pointer'
                          } text-xs font-bold px-3 py-1 rounded-lg transition-all shadow-2xs`}
                          title={isExceeded && !isAuthorizedSeniorAdmin ? "Over-quota leave requires approval from Channet, Nishadi, or Hashan" : "Approve leave"}
                        >
                          {isExceeded && !isAuthorizedSeniorAdmin ? '🔒 Restricted' : 'Approve'}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
