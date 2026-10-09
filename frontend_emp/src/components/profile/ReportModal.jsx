import React, { useRef } from 'react';
import { X, Printer, ShieldCheck, Calendar, User, Phone, Mail, MapPin, Briefcase, Award, Building, CreditCard, FolderKanban } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { getAge, getTenure, formatDisplayDate } from '../../utils/dateUtils';

export default function ReportModal({ isOpen, onClose, profile }) {
  const iframeRef = useRef(null);

  if (!isOpen || !profile) return null;

  const ageText = getAge(profile.dob);
  const tenureText = getTenure(profile.joined_date || profile.date_joined);
  const formattedDob = formatDisplayDate(profile.dob);
  const formattedJoined = formatDisplayDate(profile.joined_date || profile.date_joined);
  const generatedDate = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo'
  }).format(new Date());

  const esc = (s) => {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const logoSrc = esc(logoImg || '/logo.png');
  const avatarSrc = esc(profile.photo_url || '');
  const initials = esc(profile.initials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'EP'));
  const safeName = esc(profile.name || 'Employee');
  const safeEmpCode = esc(profile.emp_code || profile.id || '001');
  const safeStatus = esc(profile.status || 'Active');
  const safeDesignation = esc(profile.designation || 'Employee');
  const safeDepartment = esc(profile.department || 'General');
  const safeRole = esc(profile.role || 'Employee');
  const safeNic = esc(profile.nic || '-');
  const safeGender = esc(profile.gender || '-');
  const safeEmpType = esc(profile.employment_type || 'Full Time');
  const safePhone = esc(profile.phone || '-');
  const safeEmail = esc(profile.email || '-');
  const safePersonalEmail = esc(profile.personal_email || '-');
  const safeAddress = esc(profile.address || '-');
  const safeDob = esc(formattedDob);
  const safeJoined = esc(formattedJoined);
  const safeTenure = esc(tenureText !== '-' ? tenureText : 'New Staff');
  const safeAge = esc(ageText !== '-' ? `${ageText} yrs` : '-');
  const safeGenDate = esc(generatedDate);
  const assignedProjects = profile.assigned_projects || [];

  const projectsHtml = assignedProjects.length > 0 ? `
    <div class="full-width-card" style="margin-bottom: 16px;">
      <div class="section-header" style="background: #022851; color: #ffffff;">
        Assigned Projects & Executive Role Portfolio
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 7px 12px; text-align: left;">Project Name</th>
            <th style="padding: 7px 12px; text-align: left;">Client / Stakeholder</th>
            <th style="padding: 7px 12px; text-align: left;">Assigned Role</th>
            <th style="padding: 7px 12px; text-align: center;">Status</th>
            <th style="padding: 7px 12px; text-align: center;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${assignedProjects.map(p => `
            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px;">
              <td style="padding: 7px 12px; font-weight: 700; color: #07162c;">${esc(p.name)}</td>
              <td style="padding: 7px 12px; color: #475569;">${esc(p.client_name || 'Internal')}</td>
              <td style="padding: 7px 12px;">
                ${(p.role === 'Project Manager' || p.is_pm)
                  ? `<span style="background: #fef3c7; color: #92400e; font-weight: 800; font-size: 9px; padding: 2px 7px; border-radius: 4px; border: 1px solid #fde68a;">★ PROJECT MANAGER</span>`
                  : `<span style="background: #f1f5f9; color: #334155; font-weight: 700; font-size: 9px; padding: 2px 7px; border-radius: 4px;">${esc(p.role || 'Member')}</span>`
                }
              </td>
              <td style="padding: 7px 12px; text-align: center;">
                <span style="font-size: 10px; font-weight: 700; color: #022851;">${esc(p.status || 'Active')}</span>
              </td>
              <td style="padding: 7px 12px; text-align: center; font-weight: 800; font-family: monospace;">
                ${esc(p.progress || 0)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : `
    <div class="full-width-card" style="margin-bottom: 16px; padding: 12px; text-align: center; color: #64748b; font-size: 11px; background: #f8fafc;">
      No current active project assignments on record.
    </div>
  `;

  const getDossierHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Executive Personnel Dossier - ${safeName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.45;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 12px;
            border-bottom: 3px solid #07162c;
            margin-bottom: 14px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-box {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
          }
          .logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .company-name {
            font-size: 17px;
            font-weight: 900;
            color: #07162c;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            margin: 0;
          }
          .company-sub {
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin: 2px 0 0 0;
          }
          .doc-info {
            text-align: right;
          }
          .badge-confidential {
            background: #07162c;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 4px;
          }
          .ref-no {
            font-family: monospace;
            font-size: 10.5px;
            font-weight: 700;
            color: #334155;
            margin: 0;
          }
          .gen-date {
            font-size: 9.5px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .hero-card {
            background: #07162c;
            color: #ffffff;
            border-radius: 12px;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .hero-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .avatar-box {
            width: 58px;
            height: 58px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
            color: #ffffff;
            overflow: hidden;
          }
          .avatar-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .hero-title {
            font-size: 18px;
            font-weight: 900;
            margin: 0;
            color: #ffffff;
          }
          .status-pill {
            display: inline-block;
            background: rgba(16, 185, 129, 0.25);
            color: #6ee7b7;
            border: 1px solid rgba(16, 185, 129, 0.4);
            font-size: 9.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 12px;
            margin-left: 8px;
          }
          .hero-sub {
            font-size: 11.5px;
            color: #cbd5e1;
            margin: 2px 0 0 0;
          }
          .hero-meta {
            display: flex;
            gap: 14px;
            margin-top: 5px;
            font-size: 10.5px;
            color: #94a3b8;
            font-family: monospace;
          }
          .hero-meta strong {
            color: #ffffff;
          }
          .tenure-box {
            background: #152a4a;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 8px 14px;
            text-align: center;
          }
          .tenure-val {
            font-size: 15px;
            font-weight: 900;
            color: #ffffff;
            display: block;
          }
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 10px;
          }
          .stat-label {
            font-size: 8.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
          }
          .stat-val {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            display: block;
            margin-top: 2px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }
          .section-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          .section-header {
            background: #f1f5f9;
            padding: 6px 10px;
            font-size: 9.5px;
            font-weight: 800;
            color: #07162c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          td {
            padding: 5px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          td.lbl {
            color: #64748b;
            font-weight: 600;
            width: 38%;
          }
          td.val {
            color: #0f172a;
            font-weight: 700;
          }
          .full-width-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 14px;
          }
          .contact-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 10px;
          }
          .footer-sig {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 2px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sig-line {
            border-bottom: 1px solid #64748b;
            width: 150px;
            text-align: center;
            font-style: italic;
            color: #64748b;
            font-size: 9.5px;
            padding-bottom: 2px;
            margin-bottom: 3px;
          }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div class="logo-section">
            <div class="logo-box">
              <img src="${logoSrc}" alt="P W Holdings Logo" />
            </div>
            <div>
              <h1 class="company-name">P W HOLDINGS (PVT) LTD</h1>
              <p class="company-sub">Human Resources Department • Corporate Headquarters</p>
            </div>
          </div>
          <div class="doc-info">
            <span class="badge-confidential">CONFIDENTIAL</span>
            <p class="ref-no">REF: PWH/EMP/${new Date().getFullYear()}/${safeEmpCode}</p>
            <p class="gen-date">Date: ${safeGenDate}</p>
          </div>
        </div>

        <div class="hero-card">
          <div class="hero-left">
            <div class="avatar-box">
              ${avatarSrc ? `<img src="${avatarSrc}" alt="${safeName}" />` : initials}
            </div>
            <div>
              <h2 class="hero-title">${safeName} <span class="status-pill">● ${safeStatus}</span></h2>
              <p class="hero-sub">${safeDesignation} • ${safeDepartment}</p>
              <div class="hero-meta">
                <span>Emp Code: <strong>${safeEmpCode}</strong></span>
                <span>Joined: <strong>${safeJoined}</strong></span>
                <span>Role: <strong>${safeRole}</strong></span>
              </div>
            </div>
          </div>
          <div class="tenure-box">
            <span style="font-size:8.5px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Tenure</span>
            <span class="tenure-val">${safeTenure}</span>
          </div>
        </div>

        <div class="grid-4">
          <div class="stat-card">
            <span class="stat-label">Designation</span>
            <span class="stat-val">${safeDesignation}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Joined Date</span>
            <span class="stat-val">${safeJoined}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Date of Birth</span>
            <span class="stat-val">${safeDob}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Years of Service</span>
            <span class="stat-val">${safeTenure}</span>
          </div>
        </div>

        <div class="grid-2">
          <div class="section-card">
            <div class="section-header">Personal Information</div>
            <table>
              <tr><td class="lbl">Full Name</td><td class="val">${safeName}</td></tr>
              <tr><td class="lbl">NIC / National ID</td><td class="val" style="font-family:monospace">${safeNic}</td></tr>
              <tr><td class="lbl">Date of Birth</td><td class="val">${safeDob} (${safeAge})</td></tr>
              <tr><td class="lbl">Gender</td><td class="val">${safeGender}</td></tr>
            </table>
          </div>

          <div class="section-card">
            <div class="section-header">Employment Details</div>
            <table>
              <tr><td class="lbl">Employee Code</td><td class="val" style="font-family:monospace">${safeEmpCode}</td></tr>
              <tr><td class="lbl">Department</td><td class="val">${safeDepartment}</td></tr>
              <tr><td class="lbl">Designation</td><td class="val">${safeDesignation}</td></tr>
              <tr><td class="lbl">Employment Type</td><td class="val">${safeEmpType}</td></tr>
            </table>
          </div>
        </div>

        ${projectsHtml}

        <div class="full-width-card">
          <div class="section-header">Contact & Location Details</div>
          <div class="contact-grid">
            <div>
              <span class="stat-label">Phone Number</span>
              <span class="stat-val" style="font-family:monospace">${safePhone}</span>
            </div>
            <div>
              <span class="stat-label">Official Email</span>
              <span class="stat-val">${safeEmail}</span>
            </div>
            <div>
              <span class="stat-label">Personal Email</span>
              <span class="stat-val">${safePersonalEmail}</span>
            </div>
            <div style="grid-column: span 3;">
              <span class="stat-label">Residential Address</span>
              <span class="stat-val">${safeAddress}</span>
            </div>
          </div>
        </div>

        <div class="footer-sig">
          <div>
            <p style="font-size:10.5px; font-weight:700; color:#047857; margin:0;">✔ AUTHENTICATED BY P W HOLDINGS HR SYSTEM</p>
            <p style="font-size:9.5px; color:#94a3b8; margin:2px 0 0 0;">Confidential personnel record property of P W Holdings (Pvt) Ltd.</p>
          </div>
          <div style="text-align:center;">
            <div class="sig-line">Electronically Verified</div>
            <span style="font-weight:700; font-size:10.5px; display:block;">Manager - Human Resources</span>
            <span style="font-size:9.5px; color:#64748b;">P W Holdings (Pvt) Ltd</span>
          </div>
        </div>
      </body>
    </html>
  `;

  const handlePrint = () => {
    // Isolated hidden iframe print method prevents modal leakage
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      doc.open();
      doc.write(getDossierHtml());
      doc.close();

      setTimeout(() => {
        try {
          iframeRef.current.contentWindow.focus();
          iframeRef.current.contentWindow.print();
        } catch {
          // Fallback to window.open if iframe printing is blocked
          const printWindow = window.open('', '_blank', 'width=1000,height=800');
          if (printWindow) {
            printWindow.document.write(getDossierHtml());
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 250);
          }
        }
      }, 250);
      return;
    }

    // Direct window fallback
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(getDossierHtml());
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden isolated iframe for printing */}
      <iframe
        ref={iframeRef}
        title="Print Frame"
        style={{ position: 'absolute', width: 0, height: 0, border: 0, visibility: 'hidden' }}
      />

      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Executive Profile Dossier</h3>
              <p className="text-xs text-slate-500 font-medium">Official verified employment document & project portfolio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#022851] hover:bg-[#03376e] active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW DOSSIER CONTENT */}
        <div className="bg-white text-slate-800 space-y-6">
          {/* 1. Corporate Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-[#07162c]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-xs shrink-0">
                <img
                  src={logoImg}
                  alt="P W Holdings Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[#07162c] tracking-tight uppercase">P W HOLDINGS (PVT) LTD</h1>
                <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Human Resources Department • Corporate Headquarters</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Official Personnel dossier & service verification report</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mb-1">
                CONFIDENTIAL
              </span>
              <p className="text-[11px] font-mono text-slate-600 font-bold">DOC REF: PWH/EMP/{new Date().getFullYear()}/{profile?.emp_code || profile?.id || '001'}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Generated: {generatedDate}</p>
            </div>
          </div>

          {/* 2. Employee Hero Profile Card */}
          <div className="bg-[#07162c] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 text-white font-black text-2xl flex items-center justify-center border-2 border-white/20 shrink-0 shadow-inner overflow-hidden">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.initials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'EP')
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight leading-tight">{profile.name || 'Employee Profile'}</h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    ● {profile.status || 'Active'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium mt-1">{profile.designation || 'Employee'} • {profile.department || 'General'}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400 font-mono">
                  <span>Emp Code: <strong className="text-white font-semibold">{profile.emp_code || '-'}</strong></span>
                  <span>Joined: <strong className="text-white font-semibold">{formattedJoined}</strong></span>
                  <span>Role: <strong className="text-white font-semibold">{profile.role || 'Employee'}</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-[#152a4a] border border-slate-700/80 rounded-xl p-4 text-center shrink-0 w-full sm:w-auto">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block mb-1">Company Tenure</span>
              <span className="text-lg font-black text-white block">{tenureText !== '-' ? tenureText : 'New Employee'}</span>
              <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Verified Staff Member</span>
            </div>
          </div>

          {/* 3. Four Key Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designation</span>
              <span className="text-xs font-bold text-slate-900 block truncate mt-1">{profile.designation || '-'}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Full Time Staff</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joined Date</span>
              <span className="text-xs font-bold text-slate-900 block mt-1">{formattedJoined}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{tenureText}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
              <span className="text-xs font-bold text-slate-900 block mt-1">{formattedDob}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{ageText !== '-' ? `Age ${ageText}` : '-'}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Years of Service</span>
              <span className="text-xs font-bold text-slate-900 block mt-1">{tenureText}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Active Service</span>
            </div>
          </div>

          {/* 4. Detailed Information Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Personal Information</h3>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Full Name</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{profile.name || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">NIC / National ID</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{profile.nic || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">Date of Birth</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{formattedDob} ({ageText !== '-' ? `${ageText} yrs` : '-'})</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">Gender</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{profile.gender || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Employment Details</h3>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Employee Code</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{profile.emp_code || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">Department</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{profile.department || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">Designation</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{profile.designation || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500">Employment Type</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{profile.employment_type || 'Full Time'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Assigned Projects Block in Preview */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Assigned Projects & Executive Role Portfolio</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {assignedProjects.length} {assignedProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            {assignedProjects.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center font-medium">No assigned projects on record for this employee.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2 text-left">Project</th>
                    <th className="px-4 py-2 text-left">Client</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedProjects.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.client_name || 'Internal'}</td>
                      <td className="px-4 py-2.5">
                        {p.role === 'Project Manager' || p.is_pm ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                            ★ Project Manager
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {p.role || 'Team Member'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{p.status}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-900">{p.progress || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 6. Contact Information Block */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact & Location Details</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">{profile.phone || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Company / Official Email</span>
                <span className="font-bold text-slate-800 block mt-0.5 truncate">{profile.email || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Personal Email</span>
                <span className="font-bold text-slate-800 block mt-0.5 truncate">{profile.personal_email || '-'}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Residential Address</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{profile.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* 7. Document Footer with HR Authorization Signature Block */}
          <div className="pt-8 mt-8 border-t-2 border-slate-200 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHENTICATED BY P W HOLDINGS HR MANAGEMENT SYSTEM</span>
              </div>
              <p className="text-[10px] text-slate-400 max-w-md">
                This official personnel record is generated electronically for verification purposes. Confidential property of P W Holdings (Pvt) Ltd.
              </p>
            </div>

            {/* Signature Block */}
            <div className="text-center w-52 shrink-0">
              <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-[11px] text-slate-400 italic">
                Electronically Signed
              </div>
              <span className="text-xs font-bold text-slate-800 block">Manager - Human Resources</span>
              <span className="text-[10px] text-slate-400 block font-medium">P W Holdings (Pvt) Ltd</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
