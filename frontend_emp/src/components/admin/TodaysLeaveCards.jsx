import React from 'react';

export default function TodaysLeaveCards({ leaves = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 mb-8">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">Today's Leave</h3>
        <p className="text-xs text-slate-500 mt-0.5">Employees away on approved full-day leave</p>
      </div>

      {leaves.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
          No employees on approved full-day leave today.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {leaves.map((item) => (
            <div key={item.id || Math.random()} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              {/* Header info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.initials || (item.name ? item.name.slice(0, 2).toUpperCase() : 'EP')
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                      {item.department}
                  </div>
                </div>
                <span className="bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
                  On Leave
                </span>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Leave type</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {item.leave_type === 'Power Cut' ? '⚡ Power Cut' : item.leave_type === 'Short Leave' ? '⏱️ Short Leave' : (item.leave_type || 'Leave')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Duration</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{item.duration || 'Full Day'}</span>
                </div>
              </div>

              {item.from_date && item.to_date && (
                <div className="text-xs mb-3">
                  <span className="text-[11px] text-slate-400 font-medium block">Time Period</span>
                  <span className="font-semibold text-blue-700 text-xs mt-0.5 block">{item.from_date} to {item.to_date}</span>
                </div>
              )}

              <div className="text-xs">
                <span className="text-[11px] text-slate-400 font-medium block">Reason</span>
                <span className="font-medium text-slate-700 text-xs mt-0.5 block whitespace-pre-wrap break-words leading-relaxed">{item.reason || 'Personal'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
