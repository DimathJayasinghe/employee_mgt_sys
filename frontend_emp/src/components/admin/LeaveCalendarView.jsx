import React, { useState, useEffect } from 'react';
import API from '../../api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  X,
  Building
} from 'lucide-react';

export default function LeaveCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveEvents, setLeaveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch leave events for current year & month
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/admin/leave-calendar?year=${year}&month=${month + 1}`);
        const events = Array.isArray(res.data) ? res.data : (res.data?.leaves || []);
        setLeaveEvents(events);
      } catch (err) {
        console.error('Error fetching leave calendar data:', err);
        setLeaveEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [year, month]);

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (dayNum) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Check if an employee is on leave on a given date string YYYY-MM-DD
  const getLeavesForDate = (dateStr) => {
    if (!Array.isArray(leaveEvents)) return [];
    return leaveEvents.filter(event => {
      return dateStr >= event.start_date && dateStr <= event.end_date;
    });
  };

  const handleDateClick = (dateStr) => {
    setSelectedDateStr(dateStr);
    setShowModal(true);
  };

  const selectedLeaves = getLeavesForDate(selectedDateStr);

  // Badge color helper based on leave type
  const getLeaveTypeStyle = (type) => {
    switch (type) {
      case 'Casual Leave':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Half Day':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Short Leave':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Study Leave':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Medical Leave':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Annual Leave':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Power Cut':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLeaveDotColor = (type) => {
    switch (type) {
      case 'Casual Leave': return 'bg-blue-500';
      case 'Half Day': return 'bg-amber-500';
      case 'Short Leave': return 'bg-teal-500';
      case 'Study Leave': return 'bg-purple-500';
      case 'Medical Leave': return 'bg-rose-500';
      case 'Annual Leave': return 'bg-emerald-500';
      case 'Power Cut': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500">
              Click any calendar day to view full list of employees on leave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/80 py-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={d} className={`text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/30">
          {/* Empty padded cells before 1st day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/40 p-2" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDateStr(dayNum);
            const leavesOnDay = getLeavesForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer group ${
                  isSelected 
                    ? 'bg-blue-50/40 ring-2 ring-blue-500/40 ring-inset' 
                    : isToday 
                    ? 'bg-amber-50/30' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold rounded-lg w-6 h-6 flex items-center justify-center transition-colors ${
                    isToday 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-700 group-hover:text-blue-600'
                  }`}>
                    {dayNum}
                  </span>
                  {leavesOnDay.length > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {leavesOnDay.length} {leavesOnDay.length === 1 ? 'Leave' : 'Leaves'}
                    </span>
                  )}
                </div>

                {/* Event previews inside calendar box */}
                <div className="space-y-1 overflow-hidden flex-1">
                  {leavesOnDay.slice(0, 2).map((leave, idx) => (
                    <div
                      key={`${leave.id}-${idx}`}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 border ${getLeaveTypeStyle(leave.leave_type)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getLeaveDotColor(leave.leave_type)}`} />
                      <span className="truncate">{leave.employee_name}</span>
                    </div>
                  ))}
                  {leavesOnDay.length > 2 && (
                    <div className="text-[9px] font-bold text-slate-500 pl-1">
                      +{leavesOnDay.length - 2} more...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Leave Employees Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Employees on Leave
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {selectedLeaves.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Employees on Leave</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    All team members are scheduled to work on this day.
                  </p>
                </div>
              ) : (
                selectedLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {leave.photo_url ? (
                            <img src={leave.photo_url} alt={leave.employee_name} className="w-full h-full object-cover" />
                          ) : (
                            leave.initials || (leave.employee_name ? leave.employee_name.slice(0, 2).toUpperCase() : 'EP')
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {leave.employee_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{leave.department} Department</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${getLeaveTypeStyle(leave.leave_type)}`}>
                        {leave.leave_type}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="font-semibold text-slate-700">
                          {leave.start_date} → {leave.end_date} ({leave.days_count} {leave.days_count === 1 ? 'day' : 'days'})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason / Session</span>
                        <span className="font-semibold text-slate-700 whitespace-pre-wrap break-words block leading-relaxed">
                          {leave.reason || 'Personal'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">
                Total: {selectedLeaves.length} {selectedLeaves.length === 1 ? 'Employee' : 'Employees'}
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
