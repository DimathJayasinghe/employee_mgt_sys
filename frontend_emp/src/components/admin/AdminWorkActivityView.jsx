import React, { useState, useEffect } from 'react';
import API from '../../api';
import { 
  Search, Calendar, Briefcase, User, Filter, ArrowLeft, 
  Clock, ChevronRight, FileText, CheckCircle2, UserCheck, 
  Building2, Sparkles, Phone, ExternalLink 
} from 'lucide-react';

export default function AdminWorkActivityView({ onSelectEmployee }) {
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

  // Helper to extract clean text and client tags from work description
  const parseWorkDesc = (rawDesc) => {
    if (!rawDesc) return { cleanText: 'No work details provided.', clientTags: [] };
    const tagMatch = rawDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    let clientTags = [];
    if (tagMatch && tagMatch[1]) {
      clientTags = tagMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    const cleanText = rawDesc.replace(/\n?\[Clients:[^\]]+\]/gi, '').trim();
    return { cleanText: cleanText || 'No work details provided.', clientTags };
  };

  const calculateYearsOfService = (dateJoinedStr) => {
    if (!dateJoinedStr) return null;
    const joined = new Date(dateJoinedStr);
    if (isNaN(joined.getTime())) return null;
    const now = new Date();
    const diffMs = now - joined;
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 0) return null;
    if (years < 1) {
      const months = Math.floor(years * 12);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${years.toFixed(1)} yrs`;
  };

  const formatBirthday = (dobStr) => {
    if (!dobStr) return null;
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return dobStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Extract unique employees with summary info
  const employeeMap = {};
  (activities || []).forEach((act) => {
    const empId = act.user_id || act.employee_name || act.name || 'unknown';
    const empName = act.employee_name || act.name || 'Employee';
    const initials = act.initials || empName.slice(0, 2).toUpperCase();
    const photoUrl = act.photo_url || null;
    const dept = act.department || 'General';
    const designation = act.designation || null;
    const dateJoined = act.date_joined || null;
    const dob = act.dob || null;
    const phone = act.phone || null;
    const email = act.email || null;
    const empCode = act.emp_code || null;
    const entryDate = act.work_date || act.entry_date || '';

    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        id: empId,
        name: empName,
        initials: initials,
        photo_url: photoUrl,
        department: dept,
        designation: designation,
        date_joined: dateJoined,
        dob: dob,
        phone: phone,
        email: email,
        emp_code: empCode,
        logs: [],
        latestDate: entryDate
      };
    } else {
      if (photoUrl && !employeeMap[empId].photo_url) employeeMap[empId].photo_url = photoUrl;
      if (designation && !employeeMap[empId].designation) employeeMap[empId].designation = designation;
      if (dateJoined && !employeeMap[empId].date_joined) employeeMap[empId].date_joined = dateJoined;
      if (dob && !employeeMap[empId].dob) employeeMap[empId].dob = dob;
      if (phone && !employeeMap[empId].phone) employeeMap[empId].phone = phone;
      if (email && !employeeMap[empId].email) employeeMap[empId].email = email;
    }

    employeeMap[empId].logs.push(act);
    if (entryDate > employeeMap[empId].latestDate) {
      employeeMap[empId].latestDate = entryDate;
    }
  });

  const employeeList = Object.values(employeeMap).sort((a, b) => a.name.localeCompare(b.name));
  
  const filteredEmployeeList = employeeList.filter((emp) => {
    if (!searchTerm) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term) ||
      (emp.designation && emp.designation.toLowerCase().includes(term))
    );
  });

  const activeEmployee = selectedEmpId !== 'All' ? employeeList.find(e => String(e.id) === String(selectedEmpId)) : null;

  // Filter activities
  const filteredActivities = (Array.isArray(activities) ? activities : []).filter((act) => {
    const empId = act.user_id || act.employee_name || act.name || '';
    const empName = act.employee_name || act.name || '';
    const workDesc = act.work_description || '';
    const dept = act.department || '';
    const entryDate = act.work_date || act.entry_date || '';

    if (selectedEmpId !== 'All' && String(empId) !== String(selectedEmpId) && String(empName) !== String(selectedEmpId)) {
      return false;
    }

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      empName.toLowerCase().includes(term) ||
      workDesc.toLowerCase().includes(term) ||
      dept.toLowerCase().includes(term);

    const matchesDept = deptFilter === 'All' || dept.toLowerCase() === deptFilter.toLowerCase();
    const matchesDate = !dateFilter || entryDate === dateFilter;

    return matchesSearch && matchesDept && matchesDate;
  });

  // Group by date
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
    <div className="max-w-7xl mx-auto space-y-6 select-none pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            {activeEmployee ? (
              <button
                onClick={() => setSelectedEmpId('All')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl transition-all cursor-pointer border border-blue-200/80"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Employees</span>
              </button>
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Admin Portal
              </span>
            )}
            <span className="text-xs text-slate-300 font-medium">•</span>
            <span className="text-xs font-bold text-slate-500">
              {activeEmployee ? `Employee Work Stream` : 'Work Activity Center'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {activeEmployee ? `${activeEmployee.name}'s Work Activity` : 'Employee Work Activity Log'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {activeEmployee 
              ? `Displaying clean day-by-day task updates submitted strictly by ${activeEmployee.name}.`
              : 'Select any employee to view their dedicated work timeline or browse all team logs.'
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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee or task..."
              className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-8 pr-7 py-2.5 w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Selected Employee Profile Banner */}
      {activeEmployee && (
        <div className="bg-linear-to-r from-[#022851] via-[#033975] to-[#044a96] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar Photo */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-white font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-inner shrink-0 overflow-hidden">
              {activeEmployee.photo_url ? (
                <img src={activeEmployee.photo_url} alt={activeEmployee.name} className="w-full h-full object-cover" />
              ) : (
                activeEmployee.initials
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{activeEmployee.name}</h3>
                {activeEmployee.emp_code && (
                  <span className="bg-blue-400/20 text-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-300/30">
                    {activeEmployee.emp_code}
                  </span>
                )}
                <span className="bg-blue-400/30 text-blue-100 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-300/30">
                  {activeEmployee.department}
                </span>
              </div>

              {activeEmployee.designation && (
                <p className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-300" />
                  <span>{activeEmployee.designation}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200/90 font-medium pt-1">
                {activeEmployee.date_joined && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-300" />
                    <span>Joined: <strong>{activeEmployee.date_joined}</strong></span>
                    {calculateYearsOfService(activeEmployee.date_joined) && (
                      <span className="bg-white/10 text-white text-[10px] px-1.5 py-0.2 rounded font-bold ml-0.5">
                        {calculateYearsOfService(activeEmployee.date_joined)} Service
                      </span>
                    )}
                  </span>
                )}

                {activeEmployee.dob && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-300" />
                    <span>Birthday: <strong>{formatBirthday(activeEmployee.dob)}</strong></span>
                  </span>
                )}

                {(activeEmployee.phone || activeEmployee.email) && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-300" />
                    <span>{activeEmployee.phone || activeEmployee.email}</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-blue-200/80 font-medium pt-0.5 flex items-center gap-3">
                <span>Total Work Submissions: <strong className="text-white font-bold">{activeEmployee.logs.length}</strong></span>
                <span>•</span>
                <span>Latest Log: <strong className="text-white font-bold">{activeEmployee.latestDate || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {onSelectEmployee && (
              <button
                type="button"
                onClick={() => onSelectEmployee({ id: activeEmployee.id, name: activeEmployee.name, photo_url: activeEmployee.photo_url, department: activeEmployee.department })}
                className="bg-white text-blue-900 hover:bg-blue-50 active:scale-[0.98] text-xs font-black px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-700" />
                <span>View Full Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedEmpId('All')}
              className="bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>
          </div>
        </div>
      )}

      {/* Employee Quick Pick Grid (When viewing All Employees) */}
      {selectedEmpId === 'All' && !loading && filteredEmployeeList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {searchTerm ? `Matching Employees (${filteredEmployeeList.length})` : 'Select Employee to View Activity History'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{filteredEmployeeList.length} Employees</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredEmployeeList.map((emp) => (
              <button
                type="button"
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className="bg-white hover:bg-blue-50/60 rounded-xl p-3 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-800 font-bold text-[11px] flex items-center justify-center border border-blue-200 shrink-0 overflow-hidden">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      emp.initials
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {emp.logs.length} logs
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-blue-700 transition-colors">
                  {emp.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {emp.designation || emp.department}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Work Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {activeEmployee 
                ? `${activeEmployee.name}'s Daily Submissions` 
                : 'All Team Activity Stream'
              }
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading work activity logs...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No work activity records found for the selected filters.
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6">
            {sortedDates.map((dateStr) => {
              const dayLogs = activitiesByDate[dateStr];
              const dateObj = new Date(dateStr);
              const dayName = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                : dateStr;

              return (
                <div key={dateStr} className="space-y-3">
                  {/* Clean Date Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      {dayName}
                    </h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {dayLogs.length} {dayLogs.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                  </div>

                  {/* Clean Stream Items (No Cluttered Box Containers!) */}
                  <div className="space-y-2.5 pl-1">
                    {dayLogs.map((item) => {
                      const empName = item.employee_name || item.name || 'Employee';
                      const initials = item.initials || empName.slice(0, 2).toUpperCase();
                      const { cleanText, clientTags } = parseWorkDesc(item.work_description);

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200/70 hover:border-blue-300 bg-slate-50/40 hover:bg-blue-50/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Employee Avatar (If viewing all employees) */}
                            {selectedEmpId === 'All' && (
                              <button
                                type="button"
                                onClick={() => setSelectedEmpId(item.user_id || empName)}
                                title={`Click to view ${empName}'s full history`}
                                className="w-9 h-9 rounded-xl bg-white text-blue-800 font-extrabold text-xs flex items-center justify-center border border-slate-200 shadow-2xs group-hover:border-blue-400 shrink-0 cursor-pointer overflow-hidden"
                              >
                                {item.photo_url ? (
                                  <img src={item.photo_url} alt={empName} className="w-full h-full object-cover" />
                                ) : (
                                  initials
                                )}
                              </button>
                            )}

                            <div className="flex-1 min-w-0">
                              {/* Employee Header (Only when viewing all) */}
                              {selectedEmpId === 'All' && (
                                <div className="flex items-center gap-2 mb-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEmpId(item.user_id || empName)}
                                    className="font-extrabold text-slate-900 text-xs hover:text-blue-700 transition-colors text-left cursor-pointer"
                                  >
                                    {empName}
                                  </button>
                                  <span className="bg-white text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                    {item.department}
                                  </span>
                                </div>
                              )}

                              {/* Clean Work Description Text (Unboxed, clean readable font) */}
                              <div className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                                {cleanText}
                              </div>

                              {/* Selected Client Badges */}
                              {clientTags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Clients:
                                  </span>
                                  {clientTags.map((cName) => (
                                    <span
                                      key={cName}
                                      className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs"
                                    >
                                      <Building2 className="w-3 h-3 text-blue-200" />
                                      <span>{cName}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Time & Action */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{item.work_date || item.entry_date}</span>
                            </span>

                            {selectedEmpId === 'All' && (
                              <button
                                type="button"
                                onClick={() => setSelectedEmpId(item.user_id || empName)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                Filter →
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
