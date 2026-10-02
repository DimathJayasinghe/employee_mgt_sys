import React from 'react';
import { Calendar, Plus, CheckCircle2, Info, Sparkles, Clock, Zap, HeartPulse, RefreshCw } from 'lucide-react';

export default function LeaveBalanceCard({ leaveBalance, onOpenApplyLeave }) {
  const totalDays = parseFloat(leaveBalance?.total_days ?? 21);
  const totalUsed = parseFloat(leaveBalance?.used_days ?? 0);
  const totalAvailable = parseFloat(leaveBalance?.available_days ?? (totalDays - totalUsed));

  const casualTotal = parseFloat(leaveBalance?.casual?.total_days ?? 7);
  const casualUsed = parseFloat(leaveBalance?.casual?.used_days ?? 0);
  const casualAvailable = parseFloat(leaveBalance?.casual?.available_days ?? (casualTotal - casualUsed));

  const annualTotal = parseFloat(leaveBalance?.annual?.total_days ?? 14);
  const annualUsed = parseFloat(leaveBalance?.annual?.used_days ?? 0);
  const annualAvailable = parseFloat(leaveBalance?.annual?.available_days ?? (annualTotal - annualUsed));

  const overallAvailablePct = totalDays > 0 ? Math.min(100, Math.max(0, (totalAvailable / totalDays) * 100)) : 0;
  const casualAvailablePct = casualTotal > 0 ? Math.min(100, Math.max(0, (casualAvailable / casualTotal) * 100)) : 0;
  const annualAvailablePct = annualTotal > 0 ? Math.min(100, Math.max(0, (annualAvailable / annualTotal) * 100)) : 0;

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 mb-6 transition-all">
      {/* Header with Overall Total */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              Year {currentYear}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              21 Days Total (7 Casual + 14 Annual)
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">Leave Balances</h3>
        </div>

        <div className={`flex items-center gap-2 ${totalAvailable <= 0 ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200/90 text-emerald-800'} px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs`}>
          <CheckCircle2 className={`w-4 h-4 ${totalAvailable <= 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          <span>{totalAvailable} of 21 Days Available {totalAvailable > 0 && `(${overallAvailablePct.toFixed(0)}%)`}</span>
        </div>
      </div>

      {/* Two Main Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        {/* 1. Casual Leave Card (7 Days) */}
        <div className="bg-linear-to-br from-emerald-50/50 via-white to-teal-50/40 rounded-xl p-4 border border-emerald-100/80 flex flex-col justify-between relative shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold shadow-2xs">
                  🌿
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Casual Leave</h4>
                  <p className="text-[11px] font-medium text-slate-400">7 Days Quota</p>
                </div>
              </div>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${casualAvailable < 0 ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'}`}>
                {casualAvailable < 0 ? 'Quota Exceeded' : `${casualAvailablePct.toFixed(0)}% Left`}
              </span>
            </div>

            {/* Numbers */}
            <div className="flex items-baseline justify-between mt-3 mb-2">
              <div>
                <span className={`text-3xl font-extrabold tracking-tight ${casualAvailable < 0 ? 'text-red-600' : casualAvailable === 0 ? 'text-amber-600' : 'text-slate-900'}`}>{casualAvailable}</span>
                <span className="text-xs font-bold text-slate-500 ml-1.5 uppercase">Days Available</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60">
                {casualUsed} used / {casualTotal} total
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden my-2.5">
              <div
                className={`${casualAvailable < 0 ? 'bg-red-600' : 'bg-emerald-600'} h-full rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${casualAvailablePct}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <span>• Deducts for standard casual leave requests</span>
          </p>
        </div>

        {/* 2. Annual Leave Card (14 Days) */}
        <div className="bg-linear-to-br from-blue-50/50 via-white to-indigo-50/40 rounded-xl p-4 border border-blue-100/80 flex flex-col justify-between relative shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold shadow-2xs">
                  🏖️
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Annual Leave</h4>
                  <p className="text-[11px] font-medium text-slate-400">14 Days Quota</p>
                </div>
              </div>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${annualAvailable < 0 ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100/80 text-blue-800 border border-blue-200'}`}>
                {annualAvailable < 0 ? 'Quota Exceeded' : `${annualAvailablePct.toFixed(0)}% Left`}
              </span>
            </div>

            {/* Numbers */}
            <div className="flex items-baseline justify-between mt-3 mb-2">
              <div>
                <span className={`text-3xl font-extrabold tracking-tight ${annualAvailable < 0 ? 'text-red-600' : annualAvailable === 0 ? 'text-amber-600' : 'text-slate-900'}`}>{annualAvailable}</span>
                <span className="text-xs font-bold text-slate-500 ml-1.5 uppercase">Days Available</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60">
                {annualUsed} used / {annualTotal} total
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden my-2.5">
              <div
                className={`${annualAvailable < 0 ? 'bg-red-600' : 'bg-[#022851]'} h-full rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${annualAvailablePct}%` }}
              />
            </div>
          </div>

          {/* Included Types Badges */}
          <div className="mt-2 pt-2 border-t border-blue-100/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Includes 5 Leave Types:
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                🩺 Medical
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                🌓 Half Day (0.5)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                ⏱️ Short Leave
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                🔄 Special
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                📚 Study Leave
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Button */}
      {onOpenApplyLeave && (
        <button
          type="button"
          onClick={onOpenApplyLeave}
          className="mt-4 w-full bg-[#022851] hover:bg-[#03376e] active:scale-[0.99] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      )}
    </div>
  );
}
