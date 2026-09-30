import React, { useState } from 'react';
import { Users, Briefcase, Plane, ChevronDown, ChevronUp, Search, Clock, Sparkles } from 'lucide-react';

export default function TeamDutyStatusCard({ workingWorkforce = [], todaysLeave = [], teamStats }) {
  const [activeTab, setActiveTab] = useState('working'); // 'working' | 'on_leave'
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const workingList = workingWorkforce || [];
  const leaveList = todaysLeave || [];

  const currentList = activeTab === 'working' ? workingList : leaveList;
  const filteredList = currentList.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.status && emp.status.toLowerCase().includes(q)) ||
      (emp.leave_type && emp.leave_type.toLowerCase().includes(q))
    );
  });

  const displayedList = isExpanded ? filteredList : filteredList.slice(0, 3);
  const hasMore = filteredList.length > 3;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Today's Team Duty Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live view of colleagues working and away on leave today</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('working'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'working'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Working Now</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'working' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
              {workingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('on_leave'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'on_leave'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏖️ On Leave</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'on_leave' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
              {leaveList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Optional Search bar when expanded or when there are several items */}
      {(isExpanded || currentList.length > 3) && (
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'working' ? 'working colleagues' : 'colleagues on leave'}...`}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      )}

      {/* Member List */}
      <div className="mt-4 space-y-2.5 divide-y divide-slate-50">
        {filteredList.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-500">
              {searchQuery ? 'No matching colleagues found' : `No employees currently ${activeTab === 'working' ? 'on active working duty' : 'on leave today'}.`}
            </p>
          </div>
        ) : (
          displayedList.map((emp) => {
            const isWorking = activeTab === 'working';
            return (
              <div
                key={emp.id}
                className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50/90 transition-all border border-transparent hover:border-slate-100"
              >
                {/* Left: Avatar + Name + Dept */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                    isWorking 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    {emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EM')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {emp.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {emp.department || 'General'}
                    </p>
                  </div>
                </div>

                {/* Right: Duty / Leave Status Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {isWorking ? (
                    emp.is_short_leave ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-teal-200 bg-teal-50 text-teal-800 shadow-2xs">
                        <Clock className="w-3 h-3 text-teal-600" />
                        <span>Working</span>
                        <span className="text-[10px] text-teal-700 opacity-90 font-normal">
                          (Short Leave: {emp.short_leave_time || 'Later'})
                        </span>
                      </span>
                    ) : emp.is_half_day ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-800 shadow-2xs">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Working</span>
                        <span className="text-[10px] text-amber-700 opacity-90 font-normal">
                          ({emp.half_day_session === 'Morning' ? 'AM Leave' : 'PM Leave'})
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Working</span>
                      </span>
                    )
                  ) : (
                    <div className="flex flex-col items-start sm:items-end gap-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-purple-200 bg-purple-50 text-purple-800 shadow-2xs">
                        <span>🏖️ {emp.leave_type || 'On Leave'}</span>
                      </span>
                      {emp.duration && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {emp.duration}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expand / Collapse Toggle Button */}
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#022851] hover:text-blue-700 bg-slate-50 hover:bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer"
          >
            <span>
              {isExpanded
                ? 'Show less'
                : `View all ${filteredList.length} ${activeTab === 'working' ? 'working members' : 'members on leave'}`}
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
