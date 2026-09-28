import React from 'react';

export default function RecentLeaveRequestsCard({ requests = [] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
      <h3 className="text-base font-bold text-slate-900 mb-2">Recent leave requests</h3>

      {requests.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs font-medium">
          No recent leave requests found.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {requests.map((req) => {
            const isSpecial = req.leave_type === 'Special Leave';
            const isShortLeave = req.leave_type === 'Short Leave';
            const isPowerCut = req.leave_type === 'Power Cut';
            const daysText = isSpecial && req.day_of_week 
              ? req.day_of_week.split(',').map(p => {
                  const t = p.trim();
                  if (t.includes(':')) { const [d, s] = t.split(':'); return `${d.slice(0,3)} (${s})`; }
                  return t;
                }).join(', ')
              : isShortLeave && req.start_time && req.end_time
              ? `${req.start_time.slice(0,5)} - ${req.end_time.slice(0,5)}`
              : `${req.days_count} ${req.days_count === 1 ? 'Day' : 'Days'}`;
            const dateFormatted = req.start_date ? req.start_date.split('T')[0] : '';

            return (
              <div key={req.id || Math.random()} className="py-3.5 flex items-center justify-between first:pt-2 last:pb-0">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {isSpecial ? (
                      <span className="text-purple-700 font-bold flex items-center gap-1">
                        🔄 Special Leave
                      </span>
                    ) : isShortLeave ? (
                      <span className="text-teal-700 font-bold flex items-center gap-1">
                        ⏱️ Short Leave
                      </span>
                    ) : isPowerCut ? (
                      <span className="text-amber-800 font-bold flex items-center gap-1">
                        ⚡ Power Cut
                      </span>
                    ) : req.leave_type}
                  </h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {dateFormatted} · {daysText}
                  </p>
                </div>

                <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${
                  req.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                    : req.status === 'Pending'
                    ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                    : req.status === 'Cancelled'
                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200/80'
                }`}>
                  {req.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
