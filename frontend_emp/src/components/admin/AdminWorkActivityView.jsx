import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Search, Calendar, Briefcase, User, Filter, ArrowLeft, Clock, ChevronRight, FileText, CheckCircle2, UserCheck, Layers } from 'lucide-react';

export default function AdminWorkActivityView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('All');

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

  // Extract unique employees with their summary data
  const employeeMap = {};
  (activities || []).forEach((act) => {
    const empId = act.user_id || act.employee_name || act.name || 'unknown';
    const empName = act.employee_name || act.name || 'Employee';
    const initials = act.initials || empName.slice(0, 2).toUpperCase();
    const dept = act.department || 'General';
    const entryDate = act.work_date || act.entry_date || '';

    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        id: empId,
        name: empName,
        initials: initials,
        department: dept,
        logs: [],
        latestDate: entryDate
      };
    }
    employeeMap[empId].logs.push(act);
    if (entryDate > employeeMap[empId].latestDate) {
      employeeMap[empId].latestDate = entryDate;
    }
  });

  const employeeList = Object.values(employeeMap).sort((a, b) => a.name.localeCompare(b.name));

  // Find currently selected employee object if one is picked
  const activeEmployee = selectedEmpId !== 'All' ? employeeList.find(e => String(e.id) === String(selectedEmpId)) : null;

  // Filter activities based on selected employee, department, search term, and date
  const filteredActivities = (Array.isArray(activities) ? activities : []).filter((act) => {
    const empId = act.user_id || act.employee_name || act.name || '';
    const empName = act.employee_name || act.name || '';
    const workDesc = act.work_description || '';
    const dept = act.department || '';
    const entryDate = act.work_date || act.entry_date || '';

    // If a specific employee is selected
    if (selectedEmpId !== 'All' && String(empId) !== String(selectedEmpId) && String(empName) !== String(selectedEmpId)) {
      return false;
    }

    const matchesSearch =
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || dept.toLowerCase() === deptFilter.toLowerCase();
    const matchesDate = !dateFilter || entryDate === dateFilter;

    return matchesSearch && matchesDept && matchesDate;
  });

  // Group filtered activities by date for clean day-by-day display
  const activitiesByDate = {};
  filteredActivities.forEach((act) => {
    const dateKey = act.work_date || act.entry_date || 'Unknown Date';
    if (!activitiesByDate[dateKey]) {
      activitiesByDate[dateKey] = [];
    }
    activitiesByDate[dateKey].push(act);
  });

  const sortedDates = Object.keys(activitiesByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      {/* Top Header & Breadcrumb / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            {activeEmployee ? (
              <button
                onClick={() => setSelectedEmpId('All')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Employees</span>
              </button>
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Admin Portal
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs font-bold text-slate-500">
              {activeEmployee ? `Employee Timeline (${activeEmployee.name})` : 'Work Activity Center'}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {activeEmployee ? `${activeEmployee.name}'s Work History` : 'Work Activity Log'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {activeEmployee 
              ? `Day-by-day daily task updates submitted by ${activeEmployee.name}.`
              : 'Select an employee to view their individual day-by-day work history or browse all team logs.'
            }
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="appearance-none bg-white border border-blue-200 text-xs font-bold text-slate-800 rounded-xl pl-8 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="All">👥 All Employees ({employeeList.length})</option>
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.name} ({emp.logs.length} logs)
                </option>
              ))}
            </select>
            <User className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks or names..."
              className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs"
            />
          </div>

          {/* Department Filter */}
          {selectedEmpId === 'All' && (
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Depts' : d}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

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
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Selected Employee Dedicated Header Card (if employee selected) */}
      {activeEmployee && (
        <div className="bg-linear-to-br from-[#022851] to-[#043d7a] rounded-2xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white font-black text-lg flex items-center justify-center border border-white/20 shadow-inner">
              {activeEmployee.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">{activeEmployee.name}</h3>
                <span className="bg-blue-500/30 text-blue-100 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  {activeEmployee.department}
                </span>
              </div>
              <p className="text-xs text-blue-200/90 font-medium mt-1 flex items-center gap-3">
                <span>Total Work Submissions: <strong className="text-white">{activeEmployee.logs.length}</strong></span>
                <span>•</span>
                <span>Latest Update: <strong className="text-white">{activeEmployee.latestDate || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEmpId('All')}
            className="bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Employees</span>
          </button>
        </div>
      )}

      {/* Employee Cards Carousel / Grid (When viewing All Employees) */}
      {selectedEmpId === 'All' && !loading && employeeList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Select Employee to View History</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{employeeList.length} Team Members</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {employeeList.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className="bg-white hover:bg-blue-50/50 rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200 group-hover:scale-105 transition-transform">
                      {emp.initials}
                    </div>
                    <span className="bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors">
                      {emp.department}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                    {emp.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Latest: {emp.latestDate || 'No entries'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    {emp.logs.length} {emp.logs.length === 1 ? 'Log Entry' : 'Log Entries'}
                  </span>
                  <span className="text-blue-600 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View History <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Work Activity Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {activeEmployee 
                ? `Day-by-Day Logs for ${activeEmployee.name}` 
                : 'All Employee Daily Activity Stream'
              }
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'Entry' : 'Entries'} Found
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading work activity logs...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No work activity logs found for the selected filters.
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            {sortedDates.map((dateStr) => {
              const dayLogs = activitiesByDate[dateStr];
              const dateObj = new Date(dateStr);
              const dayName = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                : dateStr;

              return (
                <div key={dateStr} className="space-y-3">
                  {/* Date Section Header */}
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      {dayName}
                    </h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {dayLogs.length} {dayLogs.length === 1 ? 'Update' : 'Updates'}
                    </span>
                  </div>

                  {/* Log Items for this Date */}
                  <div className="space-y-3">
                    {dayLogs.map((item) => {
                      const empName = item.employee_name || item.name || 'Employee';
                      const initials = item.initials || empName.slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-50/70 hover:bg-blue-50/40 rounded-xl p-4 border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Clickable employee avatar */}
                            <button
                              type="button"
                              onClick={() => setSelectedEmpId(item.user_id || empName)}
                              title={`Click to view all history for ${empName}`}
                              className="w-10 h-10 rounded-xl bg-white text-blue-800 font-black text-xs flex items-center justify-center border border-slate-200 shadow-2xs group-hover:border-blue-300 transition-all shrink-0 cursor-pointer"
                            >
                              {initials}
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEmpId(item.user_id || empName)}
                                  className="font-extrabold text-slate-900 text-sm hover:text-blue-700 transition-colors text-left cursor-pointer"
                                >
                                  {empName}
                                </button>
                                <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                  {item.department}
                                </span>
                              </div>

                              {/* Work Description */}
                              <div className="mt-2 text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs whitespace-pre-wrap">
                                {item.work_description || 'No work details provided.'}
                              </div>
                            </div>
                          </div>

                          {/* Action / Date Tag */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-end md:self-start">
                            <span className="font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>{item.work_date || item.entry_date}</span>
                            </span>

                            {selectedEmpId === 'All' && (
                              <button
                                type="button"
                                onClick={() => setSelectedEmpId(item.user_id || empName)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                View History →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
