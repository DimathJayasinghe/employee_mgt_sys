import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Search, Calendar, Briefcase, User, Filter } from 'lucide-react';

export default function AdminWorkActivityView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchWorkActivity();
  }, []);

  const fetchWorkActivity = async () => {
    try {
      const res = await API.get('/admin/work-activity');
      const list = Array.isArray(res.data) ? res.data : (res.data?.activities || []);
      setActivities(list);
    } catch (err) {
      console.error('Error fetching work activity:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', 'IT', 'Finance'];

  const filtered = (Array.isArray(activities) ? activities : []).filter((act) => {
    const empName = act.employee_name || act.name || '';
    const workDesc = act.work_description || '';
    const dept = act.department || '';

    const matchesSearch =
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || dept.toLowerCase() === deptFilter.toLowerCase();

    const matchesDate = !dateFilter || act.entry_date === dateFilter;

    return matchesSearch && matchesDept && matchesDate;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Work Activity Log</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time daily task descriptions submitted by employees across the organization.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee or task..."
              className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2.5 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading work activities...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No work activity logs found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200/60 shrink-0 overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.employee_name || item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.initials || (item.employee_name ? item.employee_name.slice(0, 2).toUpperCase() : 'EP')
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.employee_name || item.name}</h4>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/80">
                        {item.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                      "{item.work_description}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0 self-end md:self-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{item.entry_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
