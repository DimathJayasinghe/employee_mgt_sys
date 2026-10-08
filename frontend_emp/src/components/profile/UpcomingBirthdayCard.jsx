import React, { useState, useEffect } from 'react';
import { Gift, Clock, ChevronRight, User } from 'lucide-react';
import { getBirthdayCountdown } from '../../utils/dateUtils';

export default function UpcomingBirthdayCard({ birthdayEmployees = [], onSelectEmployee }) {
  if (!birthdayEmployees || birthdayEmployees.length === 0) return null;

  // Filter employees whose birthday is either today or tomorrow (eve)
  const activeBirthdayEmps = birthdayEmployees.map(emp => ({
    emp,
    countdown: getBirthdayCountdown(emp.dob)
  })).filter(item => item.countdown && (item.countdown.status === 'today' || item.countdown.status === 'eve'));

  if (activeBirthdayEmps.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-pink-200/80 mb-6 bg-linear-to-r from-pink-50/40 to-purple-50/20">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-pink-100">
        <Gift className="w-4 h-4 text-pink-600" />
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Upcoming & Today's Birthdays ({activeBirthdayEmps.length})
        </h4>
      </div>

      <div className="space-y-3">
        {activeBirthdayEmps.map(({ emp, countdown }) => (
          <div
            key={emp.id}
            className="bg-white p-3 rounded-xl border border-pink-100 flex items-center justify-between shadow-2xs hover:border-pink-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center border border-pink-200 shrink-0">
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  emp.initials || (emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EP')
                )}
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800 leading-tight">{emp.name}</h5>
                <p className="text-[10px] font-medium text-pink-600 mt-0.5 flex items-center gap-1">
                  {countdown.status === 'today' ? (
                    <span>🎂 Today is {emp.name.split(' ')[0]}'s Birthday!</span>
                  ) : (
                    <span>🎁 Birthday Tomorrow in {countdown.hoursLeft} hours</span>
                  )}
                </p>
              </div>
            </div>

            {onSelectEmployee && (
              <button
                onClick={() => onSelectEmployee(emp)}
                className="bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>View</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
