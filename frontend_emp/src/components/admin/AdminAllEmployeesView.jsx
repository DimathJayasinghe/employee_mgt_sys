import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Search, ChevronDown, UserCheck, Shield } from 'lucide-react';

export default function AdminAllEmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All departments');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/admin/employees');
      const list = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
      setEmployees(list);
    } catch (err) {
      console.error('Error fetching all employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All departments', 'IT', 'Finance'];
  const statusOptions = ['All statuses', 'Working', 'All Leave', 'On Leave', 'Half Day', 'Study Leave'];

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All departments' ||
                        emp.department.toLowerCase() === deptFilter.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter === 'All Leave') {
      matchesStatus = emp.status && emp.status !== 'Working';
    } else if (statusFilter === 'Working') {
      matchesStatus = emp.status === 'Working';
    } else if (statusFilter !== 'All statuses') {
      matchesStatus = emp.status && emp.status.toLowerCase().includes(statusFilter.toLowerCase());
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">All Workforce Employees ({employees.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage company employees across all departments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employees..."
              className="bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 w-48 sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

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
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query, department, or status filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          {emp.initials}
                        </div>
                        <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp.is_half_day && !emp.half_day_leave_now ? (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
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
                      ) : emp.is_half_day && emp.half_day_leave_now ? (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-700 shadow-2xs"
                          title={`Half Day Leave Session: ${emp.half_day_time || (emp.half_day_session === 'Morning' ? '8:30 AM - 12:30 PM' : '12:30 PM - 5:30 PM')}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Half Day ({emp.half_day_session})</span>
                        </span>
                      ) : (
                        <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          emp.status === 'Working'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : emp.status === 'On Leave'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : emp.status && emp.status.includes('Half Day')
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-sky-50 text-sky-600 border-sky-200'
                        }`}>
                          {emp.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-normal min-w-[200px] max-w-md">
                      {emp.today_work ? (
                        <div className="max-h-[250px] overflow-y-auto pr-1.5 whitespace-pre-wrap leading-relaxed text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                          {emp.today_work}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
