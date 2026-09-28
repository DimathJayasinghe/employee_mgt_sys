import React from 'react';
import { Clock, Calendar } from 'lucide-react';

export default function HalfDayAndStudyLeave({ halfDayList = [], studyLeaveList = [], halfDayEmployees = [], studyLeaveEmployees = [] }) {
  const finalHalfDay = halfDayEmployees.length > 0 ? halfDayEmployees : halfDayList;
  const finalStudy = studyLeaveEmployees.length > 0 ? studyLeaveEmployees : studyLeaveList;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Half-Day Employees Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Half-Day Employees</h3>
              <p className="text-xs text-slate-500 mt-0.5">Morning (8:30 AM - 12:30 PM) · Evening (12:30 PM - 5:30 PM)</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {finalHalfDay.length} Scheduled
            </span>
          </div>

          {finalHalfDay.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
              No employees on half-day schedule today.
            </div>
          ) : (
            <div className="space-y-4">
              {finalHalfDay.map((emp) => {
                const isMorning = (emp.half_day_session === 'Morning') || (emp.session && emp.session.includes('Morning')) || (emp.reason && emp.reason.includes('Morning'));
                const sessionTitle = isMorning ? 'Morning Session' : 'Evening Session';
                const leaveHours = isMorning ? '08:30 AM - 12:30 PM' : '12:30 PM - 05:30 PM';
                const workingHours = isMorning ? '12:30 PM - 05:30 PM' : '08:30 AM - 12:30 PM';
                const isLeaveNow = emp.is_leave_now !== undefined ? emp.is_leave_now : emp.half_day_leave_now;

                return (
                  <div key={emp.id || Math.random()} className="border border-slate-200/80 bg-slate-50/50 rounded-2xl p-4 transition-all hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                          {emp.initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {emp.department}
                          </p>
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      {isLeaveNow ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>On Leave Now</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs">
                          <span className="w-2.5 h-2.5 rounded-full overflow-hidden flex border border-emerald-400 shrink-0">
                            <span className="w-1/2 h-full bg-emerald-500"></span>
                            <span className="w-1/2 h-full bg-amber-500"></span>
                          </span>
                          <span>Working Now</span>
                          <span className="bg-amber-100 text-amber-800 border border-amber-300/80 text-[9px] px-1 py-0.2 rounded font-bold">
                            {isMorning ? 'AM Leave' : 'PM Leave'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                          🏖️ {sessionTitle} (Leave)
                        </span>
                        <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                          {leaveHours}
                        </span>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                          💼 Active Duty (Working)
                        </span>
                        <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                          {workingHours}
                        </span>
                      </div>
                    </div>

                    {emp.reason && (
                      <p className="text-[11px] text-slate-500 mt-2 font-normal italic">
                        Reason: {emp.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Study Leave Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Study Leave</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">Approved study time for today</p>

          {studyLeaveList.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
              No employees on study leave today.
            </div>
          ) : (
            <div className="space-y-4">
              {studyLeaveList.map((studyLeave) => (
                <div key={studyLeave.id || Math.random()} className="bg-[#eaf4fd] border border-blue-200/70 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                        {studyLeave.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{studyLeave.name}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {studyLeave.department}
                        </p>
                      </div>
                    </div>
                    <span className="bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold px-2.5 py-1 rounded-md">
                      Study Leave
                    </span>
                  </div>

                  {studyLeave.from_date && studyLeave.to_date ? (
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 my-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Time Period: {studyLeave.from_date} to {studyLeave.to_date}
                        {studyLeave.duration && ` (${studyLeave.duration})`}
                      </span>
                    </div>
                  ) : studyLeave.duration ? (
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 my-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Duration: {studyLeave.duration}</span>
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-600 font-medium">Reason: {studyLeave.reason || 'Examination'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
