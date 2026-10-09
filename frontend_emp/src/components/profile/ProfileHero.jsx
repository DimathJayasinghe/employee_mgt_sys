import React from 'react';
import { ArrowLeft, Edit3, Briefcase, FileText, Calendar, Camera } from 'lucide-react';
import { formatDateDot, calculateTenure } from '../../utils/dateUtils';

export default function ProfileHero({ profile, onBack, onOpenEditModal, onOpenPhotoModal }) {
  const name = profile?.name || 'Employee';
  const designation = profile?.designation || '';
  const cardDesignation = profile?.card_designation || '';
  const empCode = profile?.emp_code || '-';
  const department = profile?.department || '-';
  const rawJoined = profile?.date_joined || profile?.joined_date;
  const joinedDate = formatDateDot(rawJoined);
  const tenure = calculateTenure(rawJoined);
  const status = profile?.status || 'Working';

  // Parse skill chips: first 4 + (+N)
  let skills = [];
  if (Array.isArray(profile?.skills)) {
    skills = profile.skills;
  } else if (typeof profile?.skills === 'string') {
    try {
      const parsed = JSON.parse(profile.skills);
      if (Array.isArray(parsed)) skills = parsed;
    } catch {
      skills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const visibleSkills = skills.slice(0, 4);
  const extraSkillsCount = Math.max(0, skills.length - 4);

  const initials = profile?.initials || (name ? name.slice(0, 2).toUpperCase() : 'EP');

  return (
    <div className="bg-[#07162c] text-slate-300 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        
        {/* Profile Photo / Avatar with Photo Upload Trigger */}
        <div className="relative group shrink-0">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt={name}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/20 shadow-md"
            />
          ) : null}

          {/* Initials Fallback */}
          <div
            style={{ display: profile?.photo_url ? 'none' : 'flex' }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#152a4a] text-white font-extrabold text-2xl sm:text-3xl items-center justify-center border-2 border-slate-700 shadow-md"
          >
            {initials}
          </div>

          {/* Photo Upload Hover Badge */}
          {onOpenPhotoModal && (
            <button
              onClick={onOpenPhotoModal}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center border-2 border-[#07162c] shadow-md transition-transform hover:scale-105 cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hero Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
            {/* Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer mr-1"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {name}
            </h3>

            {/* Active / Working Status Pill with Pulsating Green Dot */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{status}</span>
            </span>
          </div>

          {/* Designation & Card Designation */}
          {designation || cardDesignation ? (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              {designation && (
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  {designation}
                </p>
              )}
              {cardDesignation && (
                <span className="text-[11px] font-semibold text-sky-300 bg-sky-950/80 border border-sky-800/80 px-2.5 py-0.5 rounded-md shadow-2xs">
                  Card: {cardDesignation}
                </span>
              )}
            </div>
          ) : null}

          {/* Meta details bar */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-slate-400 font-medium pt-2.5 border-t border-slate-800/80 mb-3">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-200 font-semibold">{department}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Emp Code:</span>
              <span className="text-white font-bold tracking-wider">{empCode}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Joined:</span>
              <span className="text-slate-300 font-medium">
                {joinedDate} {tenure.text !== '-' && <span className="text-emerald-400 font-bold ml-1">{tenure.text}</span>}
              </span>
            </span>
          </div>

          {/* Skill Chips (First 4 + "+N") */}
          {skills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              {visibleSkills.map((skill, i) => (
                <span key={i} className="text-[10px] font-bold bg-[#152a4a] text-blue-200 px-2.5 py-0.5 rounded-md border border-slate-700/60 shadow-2xs">
                  {skill}
                </span>
              ))}
              {extraSkillsCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/40">
                  +{extraSkillsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Action Button */}
        {onOpenEditModal && (
          <div className="shrink-0 self-center sm:self-start">
            <button
              onClick={onOpenEditModal}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
