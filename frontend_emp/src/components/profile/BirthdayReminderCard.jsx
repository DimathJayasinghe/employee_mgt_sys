import React, { useState, useEffect } from 'react';
import { Gift, Clock, Sparkles, ChevronRight, User } from 'lucide-react';
import { getBirthdayCountdown } from '../../utils/dateUtils';

export default function BirthdayReminderCard({ profile, onSelectEmployee }) {
  const [countdown, setCountdown] = useState(() => getBirthdayCountdown(profile?.dob));

  useEffect(() => {
    setCountdown(getBirthdayCountdown(profile?.dob));
    // Update live countdown every minute (60 seconds)
    const timer = setInterval(() => {
      setCountdown(getBirthdayCountdown(profile?.dob));
    }, 60000);
    return () => clearInterval(timer);
  }, [profile?.dob]);

  if (!profile?.dob || !countdown) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Birthday Information</h4>
            <p className="text-[11px] text-slate-400">Birthday is not set for this profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const name = profile?.name || 'Employee';

  // 1. On Birthday Day
  if (countdown.status === 'today') {
    return (
      <div className="bg-linear-to-r from-pink-500 via-rose-500 to-purple-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden mb-6 animate-in fade-in duration-300">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  Today's Celebration
                </span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Today is {name}'s Birthday! 🎂
              </h3>
              <p className="text-xs text-pink-100/90 font-medium mt-0.5">
                Wish {name} a wonderful day! ({countdown.displayDate})
              </p>
            </div>
          </div>

          {onSelectEmployee && (
            <button
              onClick={() => onSelectEmployee(profile)}
              className="bg-white text-pink-700 hover:bg-pink-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Eve of Birthday (between 12:00 and 24:00 day before)
  if (countdown.status === 'eve') {
    return (
      <div className="bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-6 shadow-md relative overflow-hidden mb-6 animate-in fade-in duration-300">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-200" />
                  Birthday Tomorrow
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                In {countdown.hoursLeft} {countdown.hoursLeft === 1 ? 'hour' : 'hours'}! ({name}'s Birthday)
              </h3>
              <p className="text-xs text-orange-100/90 font-medium mt-0.5">
                Birthday on {countdown.displayDate}. Reminders scheduled.
              </p>
            </div>
          </div>

          {onSelectEmployee && (
            <button
              onClick={() => onSelectEmployee(profile)}
              className="bg-white text-orange-700 hover:bg-amber-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Standard Upcoming Birthday Card
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Next birthday: {countdown.displayDate}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              (in {countdown.daysLeft} {countdown.daysLeft === 1 ? 'day' : 'days'})
            </p>
          </div>
        </div>

        {onSelectEmployee && (
          <button
            onClick={() => onSelectEmployee(profile)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
