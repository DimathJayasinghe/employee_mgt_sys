import React from 'react';
import { Briefcase, Calendar, Heart, Award } from 'lucide-react';
import { formatDateDot, formatBirthdayStyle, calculateTenure } from '../../utils/dateUtils';

export default function StatCard({ profile }) {
  const designation = profile?.designation || '-';
  const cardDesignation = profile?.card_designation || '';
  const employmentType = profile?.employment_type || 'Full Time';

  const tenure = calculateTenure(profile?.date_joined);
  const joinedDateFormatted = formatDateDot(profile?.date_joined);

  const birthdayFormatted = formatBirthdayStyle(profile?.dob);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Designation */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Designation</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900 truncate" title={designation}>
            {designation}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            {cardDesignation ? `Card: ${cardDesignation}` : employmentType}
          </p>
        </div>
      </div>

      {/* 2. Joined Date with (X Years Y Months) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900 truncate">
            {joinedDateFormatted}
          </h4>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            {tenure.text !== '-' ? tenure.text : '-'}
          </p>
        </div>
      </div>

      {/* 3. Birthday as "31 March" style */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Birthday</span>
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100">
            <Heart className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900 truncate">
            {birthdayFormatted}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {profile?.dob ? (profile?.gender || 'Date of Birth') : 'Birthday not set'}
          </p>
        </div>
      </div>

      {/* 4. Years of Service */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Years of Service</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900 truncate">
            {tenure.shortText}
          </h4>
          <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Company Tenure</p>
        </div>
      </div>
    </div>
  );
}
