import React from 'react';
import { User, Briefcase, Phone, Edit3, Sparkles } from 'lucide-react';
import { formatDateDot, formatBirthdayStyle, calculateTenure } from '../../utils/dateUtils';

export function PersonalInfoCard({ profile, onOpenEditModal }) {
  const name = profile?.name || '-';
  const nic = profile?.nic || '-';
  const birthday = formatBirthdayStyle(profile?.dob);
  const dobFormatted = formatDateDot(profile?.dob);
  const gender = profile?.gender || '-';
  const personalEmail = profile?.personal_email || '-';
  const phone = profile?.phone || '-';
  const address = profile?.address || '-';
  const schoolAttended = profile?.school_attended || profile?.school || '-';
  const tshirtSize = profile?.tshirt_size || profile?.t_shirt_size || '-';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-[#022851]" />
          <span>Personal Information</span>
        </h3>
        {onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="bg-blue-50 text-blue-700 border border-blue-200/90 hover:bg-blue-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Full Name</span>
          <span className="font-bold text-slate-800 text-sm">{name}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">NIC / National ID</span>
          <span className="font-bold text-slate-800 text-sm">{nic}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Date of Birth</span>
          <span className="font-bold text-slate-800 text-sm">{birthday}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Gender</span>
          <span className="font-bold text-slate-800 text-sm">{gender}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">School Attended</span>
          <span className="font-bold text-slate-800 text-sm">{schoolAttended}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">T-Shirt Size</span>
          <span className="font-bold text-slate-800 text-sm inline-flex items-center gap-1.5">
            {tshirtSize !== '-' ? (
              <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-blue-200">
                {tshirtSize}
              </span>
            ) : '-'}
          </span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Personal Email</span>
          <span className="font-bold text-slate-800 text-sm truncate block">{personalEmail}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Phone Number</span>
          <span className="font-bold text-slate-800 text-sm">{phone}</span>
        </div>

        <div className="md:col-span-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Residential Address</span>
          <span className="font-semibold text-slate-800 text-xs leading-relaxed">{address}</span>
        </div>
      </div>
    </div>
  );
}

export function EmploymentInfoCard({ profile, onOpenEditModal }) {
  const currentUser = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUser?.role === 'Admin';

  const empCode = profile?.emp_code || '-';
  const designation = profile?.designation || '-';
  const cardDesignation = profile?.card_designation || '-';
  const department = profile?.department || '-';
  const employmentType = profile?.employment_type || 'Full Time';
  const rawJoined = profile?.date_joined || profile?.joined_date;
  const dateJoined = formatDateDot(rawJoined);
  const tenure = calculateTenure(rawJoined);
  const role = profile?.role || 'Employee';
  const status = profile?.status || 'Working';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#022851]" />
          <span>Employment Details</span>
        </h3>
        {onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="bg-blue-50 text-blue-700 border border-blue-200/90 hover:bg-blue-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Employee Code</span>
          <span className="font-bold text-slate-900 text-sm font-mono">{empCode}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Designation</span>
          <span className="font-bold text-slate-800 text-sm">{designation}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Card Designation</span>
          <span className="font-bold text-slate-800 text-sm">{cardDesignation}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Department</span>
          <span className="font-bold text-slate-800 text-sm">{department}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Employment Type</span>
          <span className="font-bold text-slate-800 text-sm">{employmentType}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Date Joined</span>
          <span className="font-bold text-slate-800 text-sm block">{dateJoined}</span>
          {tenure.text !== '-' && (
            <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">{tenure.text}</span>
          )}
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">System Role</span>
          <span className="font-bold text-slate-800 text-sm">{role}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Duty Status</span>
          <span className="font-bold text-slate-800 text-sm">{status}</span>
        </div>
      </div>
    </div>
  );
}

export function ContactInfoCard({ profile, onOpenEditModal }) {
  const email = profile?.email || '-';
  const personalEmail = profile?.personal_email || '-';
  const phone = profile?.phone || '-';
  const address = profile?.address || '-';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#022851]" />
          <span>Contact Information</span>
        </h3>
        {onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="bg-blue-50 text-blue-700 border border-blue-200/90 hover:bg-blue-100 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Official Work Email</span>
          <span className="font-bold text-slate-800 text-sm truncate block">{email}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Personal Email</span>
          <span className="font-bold text-slate-800 text-sm truncate block">{personalEmail}</span>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Phone Number</span>
          <span className="font-bold text-slate-800 text-sm">{phone}</span>
        </div>

        <div className="md:col-span-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Residential Address</span>
          <span className="font-semibold text-slate-800 text-xs leading-relaxed">{address}</span>
        </div>
      </div>
    </div>
  );
}
