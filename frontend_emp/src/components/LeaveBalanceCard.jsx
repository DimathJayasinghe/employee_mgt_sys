import React from 'react';
import { Calendar, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LeaveBalanceCard({ leaveBalance, onOpenApplyLeave }) {
  const available = parseFloat(leaveBalance?.available_days ?? 24);
  const used = parseFloat(leaveBalance?.used_days ?? 0);
  const total = parseFloat(leaveBalance?.total_days ?? 24);

  const usedPercentage = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  const availablePercentage = 100 - usedPercentage;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            Year 2026
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">Leave Balance</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      {/* Main Remaining Days Display */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">Available to take</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{available}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">Remaining Days</span>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{availablePercentage.toFixed(0)}% available</span>
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-4 relative">
        <div
          className="bg-[#022851] h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${availablePercentage}%` }}
        />
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">Days Taken</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{used} days</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">Total Entitlement</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{total} days</p>
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
