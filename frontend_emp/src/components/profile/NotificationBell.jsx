import React, { useState, useEffect, useRef } from 'react';
import { Bell, Gift, ChevronRight, Sparkles } from 'lucide-react';
import API from '../../api';
import { getBirthdayCountdown } from '../../utils/dateUtils';

export default function NotificationBell({ onSelectEmployee }) {
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBirthdays = async () => {
    try {
      const res = await API.get('/profile/upcoming-birthdays');
      if (Array.isArray(res.data)) {
        setBirthdayUsers(res.data);
      }
    } catch (err) {
      console.warn('Notification bell fetch error:', err.message);
    }
  };

  // Filter employees with active birthday notifications (today or tomorrow eve)
  const activeNotifications = birthdayUsers.map(emp => ({
    emp,
    countdown: getBirthdayCountdown(emp.dob)
  })).filter(item => item.countdown && (item.countdown.status === 'today' || item.countdown.status === 'eve'));

  const count = activeNotifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
        title="Birthday Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-2xs">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-600" />
              <h4 className="text-xs font-bold text-slate-900">Birthday Reminders</h4>
            </div>
            <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-100">
              {count} Active
            </span>
          </div>

          {count === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              No birthday notifications for today or tomorrow.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeNotifications.map(({ emp, countdown }) => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (onSelectEmployee) onSelectEmployee(emp);
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-pink-50/60 hover:border-pink-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 font-bold text-[11px] flex items-center justify-center border border-pink-200 shrink-0">
                      {emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EP')}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 leading-tight">{emp.name}</h5>
                      <p className="text-[10px] font-medium text-pink-600 mt-0.5">
                        {countdown.status === 'today' 
                          ? "🎉 Today is their Birthday!" 
                          : `🎁 Tomorrow (in ${countdown.hoursLeft} hrs)`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
