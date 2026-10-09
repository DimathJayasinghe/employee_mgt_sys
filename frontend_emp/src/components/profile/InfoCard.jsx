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

export function AssignedProjectsCard({ profile }) {
  const projects = profile?.assigned_projects || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#022851]" />
          <h3 className="text-base font-bold text-slate-900">Assigned Projects</h3>
          <span className="bg-blue-100 text-[#022851] text-[11px] font-extrabold px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Active project portfolio</span>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-500 font-medium">No projects currently assigned to this employee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(proj => {
            const isPM = proj.role === 'Project Manager' || proj.is_pm;
            const statusColor = 
              proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              proj.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              proj.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div key={proj.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{proj.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor} shrink-0`}>
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-slate-500 mb-2">
                    Client: <strong className="text-slate-700 font-semibold">{proj.client_name || 'Internal'}</strong>
                  </p>

                  {proj.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-150">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 text-[11px]">Role on Project</span>
                    {isPM ? (
                      <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-md shadow-2xs tracking-wide">
                        ★ Project Manager
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {proj.role || 'Team Member'}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                      <span>Progress</span>
                      <span className="text-slate-800 font-bold">{proj.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#022851] h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, Math.max(0, proj.progress || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

