import React, { useState } from 'react';
import { Search, ChevronDown, ArrowUpRight, Building2 } from 'lucide-react';

export default function TodaysWorkforceTable({ workforce = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [workFilter, setWorkFilter] = useState('All Work Status');

  const departments = ['All departments', 'IT', 'Finance'];
  const workFilterOptions = ['All Work Status', 'Work Submitted', 'Pending Description'];

  const parseWorkDesc = (rawDesc) => {
    if (!rawDesc) return { cleanText: '', clientTags: [] };
    const tagMatch = rawDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    let clientTags = [];
    if (tagMatch && tagMatch[1]) {
      clientTags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    const cleanText = rawDesc.replace(/\n?\[Clients:[^\]]+\]/gi, '').trim();
    return { cleanText, clientTags };
  };

  const filtered = workforce.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.today_work && emp.today_work.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = departmentFilter === 'All departments' ||
                        emp.department.toLowerCase() === departmentFilter.toLowerCase();
    
    let matchesWork = true;
    if (workFilter === 'Work Submitted') {
      matchesWork = emp.today_work && emp.today_work.trim() !== '';
    } else if (workFilter === 'Pending Description') {
      matchesWork = !emp.today_work || emp.today_work.trim() === '';
    }

    return matchesSearch && matchesDept && matchesWork;
  });

  const filledCount = workforce.filter(e => e.today_work && e.today_work.trim() !== '').length;
  const pendingCount = workforce.length - filledCount;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-8 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-900">Today's Workforce</h3>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filtered.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Employees currently on active working duty ({filledCount} submitted description, {pendingCount} pending)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workforce..."
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 w-44 sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Work Description Filter Dropdown */}
          <div className="relative">
            <select
              value={workFilter}
              onChange={(e) => setWorkFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {workFilterOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Updated</th>
              <th className="px-6 py-3.5">Today's Work</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                  No matching employees working today.
                </td>
              </tr>
            ) : (
              filtered.map((emp, idx) => (
                <tr key={emp.id || emp.emp_code || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs overflow-hidden">
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EP')
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{emp.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {emp.is_half_day ? (
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
                        title={`Half Day: ${emp.half_day_session === 'Morning' ? 'Morning Leave (8:30 AM - 12:30 PM) · Working (12:30 PM - 5:30 PM)' : 'Working (8:30 AM - 12:30 PM) · Evening Leave (12:30 PM - 5:30 PM)'}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full overflow-hidden flex border border-emerald-400 shrink-0 shadow-2xs">
                          <span className="w-1/2 h-full bg-emerald-500"></span>
                          <span className="w-1/2 h-full bg-amber-500"></span>
                        </span>
                        <span>Working</span>
                        <span className="bg-amber-100 text-amber-800 border border-amber-300/80 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          {emp.half_day_session === 'Morning' ? 'AM Leave' : 'PM Leave'}
                        </span>
                      </span>
                    ) : emp.is_short_leave ? (
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
                        title={`Short Leave today: ${emp.short_leave_time || 'Time window'} (${emp.short_leave_duration || 0} hrs)`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full overflow-hidden flex border border-emerald-400 shrink-0 shadow-2xs">
                          <span className="w-1/2 h-full bg-emerald-500"></span>
                          <span className="w-1/2 h-full bg-teal-500"></span>
                        </span>
                        <span>Working</span>
                        <span className="bg-teal-100 text-teal-800 border border-teal-300/80 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          Short Leave ({emp.short_leave_time})
                        </span>
                      </span>
                    ) : (
                      <span className={`inline-block whitespace-nowrap border text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                        emp.status && emp.status.includes('Study Leave')
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                      }`}>
                        {emp.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[11px] font-medium whitespace-nowrap">{emp.updated_ago}</td>
                  <td className="px-6 py-4 text-slate-800 font-normal min-w-[240px] max-w-md">
                    {emp.today_work ? (() => {
                      const { cleanText, clientTags } = parseWorkDesc(emp.today_work);
                      return (
                        <div className="max-h-[250px] overflow-y-auto pr-1.5 whitespace-pre-wrap leading-relaxed text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 space-y-2">
                          <div>{cleanText || 'Work submitted'}</div>
                          {clientTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients:</span>
                              {clientTags.map(cName => (
                                <span key={cName} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                  <Building2 className="w-3 h-3 text-blue-200" />
                                  <span>{cName}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <span className="text-slate-400 italic text-xs">No description yet</span>
                    )}
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
