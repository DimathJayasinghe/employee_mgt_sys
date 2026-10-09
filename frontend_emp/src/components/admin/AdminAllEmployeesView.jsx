import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Search, ChevronDown, UserCheck, Shield, Building2, UserPlus } from 'lucide-react';
import AddProfileModal from './AddProfileModal';

export default function AdminAllEmployeesView({ employees: initialEmployees = [], onSelectEmployee }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [loading, setLoading] = useState(!initialEmployees || initialEmployees.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All departments');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [workFilter, setWorkFilter] = useState('All Work Status');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  useEffect(() => {
    if (initialEmployees && initialEmployees.length > 0) {
      setEmployees(initialEmployees);
      setLoading(false);
    }
    fetchEmployees();
  }, [initialEmployees]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/admin/employees');
      const list = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
      if (list && list.length > 0) {
        setEmployees(list);
      }
    } catch (err) {
      console.error('Error fetching all employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All departments', 'IT', 'Finance'];
  const statusOptions = [
    'All statuses', 
    'Working', 
    'All Leave', 
    'Casual Leave', 
    'Medical Leave', 
    'Half Day', 
    'Short Leave', 
    'Study Leave',
    'Power Cut',
    'Special Leave'
  ];
  const workFilterOptions = ['All Work Status', 'Work Submitted', 'Pending Description'];

  const filtered = employees.filter(emp => {
    if (!emp) return false;
    const empName = (emp.name || '').toLowerCase();
    const empDept = (emp.department || '').toLowerCase();
    const leaveType = (emp.leave_type || '').toLowerCase();
    const todayWork = (emp.today_work || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();

    const matchesSearch = empName.includes(term) ||
                          empDept.includes(term) ||
                          leaveType.includes(term) ||
                          todayWork.includes(term);
    const matchesDept = deptFilter === 'All departments' ||
                        empDept === deptFilter.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter === 'All Leave') {
      matchesStatus = emp.status && emp.status !== 'Working';
    } else if (statusFilter === 'Working') {
      matchesStatus = emp.status === 'Working';
    } else if (statusFilter === 'Casual Leave') {
      matchesStatus = (emp.leave_type === 'Casual Leave') || (emp.status && emp.status.toLowerCase().includes('casual'));
    } else if (statusFilter === 'Medical Leave') {
      matchesStatus = (emp.leave_type === 'Medical Leave') || (emp.status && emp.status.toLowerCase().includes('medical'));
    } else if (statusFilter === 'Half Day') {
      matchesStatus = emp.is_half_day || (emp.status && emp.status.toLowerCase().includes('half day')) || (emp.leave_type === 'Half Day');
    } else if (statusFilter === 'Short Leave') {
      matchesStatus = emp.is_short_leave || (emp.status && emp.status.toLowerCase().includes('short leave')) || (emp.leave_type === 'Short Leave');
    } else if (statusFilter === 'Study Leave') {
      matchesStatus = (emp.leave_type === 'Study Leave') || (emp.status && emp.status.toLowerCase().includes('study leave'));
    } else if (statusFilter === 'Power Cut') {
      matchesStatus = (emp.leave_type === 'Power Cut') || (emp.status && emp.status.toLowerCase().includes('power cut'));
    } else if (statusFilter === 'Special Leave') {
      matchesStatus = (emp.leave_type === 'Special Leave') || (emp.status && emp.status.toLowerCase().includes('special leave'));
    } else if (statusFilter !== 'All statuses') {
      matchesStatus = emp.status && emp.status.toLowerCase().includes(statusFilter.toLowerCase());
    }

    let matchesWork = true;
    if (workFilter === 'Work Submitted') {
      matchesWork = emp.today_work && emp.today_work.trim() !== '';
    } else if (workFilter === 'Pending Description') {
      matchesWork = !emp.today_work || emp.today_work.trim() === '';
    }

    return matchesSearch && matchesDept && matchesStatus && matchesWork;
  });

  const filledCount = employees.filter(e => e.today_work && e.today_work.trim() !== '').length;
  const pendingCount = employees.length - filledCount;

  const renderStatusBadge = (emp) => {
    // 1. Half Day
    if (emp.is_half_day && !emp.half_day_leave_now) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
          title={`Half Day (${emp.half_day_session} Session): Working now · Leave (${emp.half_day_time || ''})`}
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
      );
    }
    if (emp.is_half_day && emp.half_day_leave_now) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-700 shadow-2xs"
          title={`Half Day Leave (${emp.half_day_session} Session): ${emp.half_day_time || (emp.half_day_session === 'Morning' ? '8:30 AM - 12:30 PM' : '12:30 PM - 5:30 PM')}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Half Day ({emp.half_day_session})</span>
        </span>
      );
    }

    // 2. Short Leave
    if (emp.is_short_leave && !emp.short_leave_now) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
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
      );
    }
    if (emp.is_short_leave && emp.short_leave_now) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-teal-200 bg-teal-50 text-teal-700 shadow-2xs"
          title={`Currently away on Short Leave: ${emp.short_leave_time || 'Time window'} (${emp.short_leave_duration || 0} hrs)`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>Short Leave ({emp.short_leave_time})</span>
        </span>
      );
    }

    // 3. Power Cut
    if (emp.leave_type === 'Power Cut' || (emp.status && emp.status.includes('Power Cut'))) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-amber-300 bg-amber-50 text-amber-800 shadow-2xs"
          title="Away due to scheduled Power Cut"
        >
          <span>⚡ Power Cut</span>
        </span>
      );
    }

    // 4. Study Leave
    if (emp.leave_type === 'Study Leave' || (emp.status && emp.status.includes('Study Leave'))) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-sky-200 bg-sky-50 text-sky-700 shadow-2xs"
          title={`Study Leave: ${emp.leave_reason || 'Approved study session'}`}
        >
          <span>🎓 Study Leave</span>
        </span>
      );
    }

    // 5. Special Leave
    if (emp.leave_type === 'Special Leave' || (emp.status && emp.status.includes('Special Leave'))) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-purple-200 bg-purple-50 text-purple-700 shadow-2xs"
          title="Special recurring leave"
        >
          <span>🔄 Special Leave</span>
        </span>
      );
    }

    // 6. Casual Leave
    if (emp.leave_type === 'Casual Leave' || (emp.status && emp.status.includes('Casual'))) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700 shadow-2xs"
          title={`Casual Leave: ${emp.leave_reason || 'Personal leave'}`}
        >
          <span>🏖️ Casual Leave</span>
        </span>
      );
    }

    // 7. Medical Leave
    if (emp.leave_type === 'Medical Leave' || (emp.status && emp.status.includes('Medical'))) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-red-200 bg-red-50 text-red-700 shadow-2xs"
          title={`Medical Leave: ${emp.leave_reason || 'Medical reasons'}`}
        >
          <span>🏥 Medical Leave</span>
        </span>
      );
    }

    // 8. Other On Leave types
    if (emp.leave_type || (emp.status && emp.status !== 'Working')) {
      const typeLabel = emp.leave_type || emp.status;
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700 shadow-2xs"
          title={`Leave: ${emp.leave_reason || typeLabel}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>{typeLabel.startsWith('On Leave') ? typeLabel : `On Leave (${typeLabel})`}</span>
        </span>
      );
    }

    // 9. Standard Working
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Working</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900">All Workforce Employees ({employees.length})</h2>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filtered.length} Showing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company employees ({filledCount} filled today's work, {pendingCount} pending)
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
              placeholder="Search employees or leaves..."
              className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 w-44 sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Leave / Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Work Description Filter Dropdown */}
          <div className="relative">
            <select
              value={workFilter}
              onChange={(e) => setWorkFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 rounded-xl pl-3 pr-8 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {workFilterOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Employee Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#022851] hover:bg-[#03376e] active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">Loading workforce directory...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Today's Status</th>
                <th className="px-6 py-3.5">Work Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No employees found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query, department, status, or work description filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden shadow-2xs">
                            {emp.photo_url ? (
                              <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EP')
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{emp.name}</span>
                            {emp.role === 'Admin' && (
                              <span className="text-[10px] text-blue-600 font-bold">Admin</span>
                            )}
                          </div>
                        </div>
                        {onSelectEmployee && (
                          <button
                            onClick={() => onSelectEmployee(emp)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer shrink-0"
                            title="View Employee Profile"
                          >
                            View Profile
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(emp)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal min-w-[200px] max-w-md">
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
      )}

      {/* Add Employee Modal */}
      <AddProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeCreated={() => fetchEmployees()}
      />
    </div>
  );
}
