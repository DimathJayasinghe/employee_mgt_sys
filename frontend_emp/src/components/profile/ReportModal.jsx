import React from 'react';
import { X, Printer, ShieldCheck, Calendar, User, Phone, Mail, MapPin, Briefcase, Award, Building, CreditCard } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { getAge, getTenure, formatDisplayDate } from '../../utils/dateUtils';

export default function ReportModal({ isOpen, onClose, profile }) {
  if (!isOpen || !profile) return null;

  const ageText = getAge(profile.dob);
  const tenureText = getTenure(profile.joined_date);
  const formattedDob = formatDisplayDate(profile.dob);
  const formattedJoined = formatDisplayDate(profile.joined_date);
  const generatedDate = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo'
  }).format(new Date());

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const logoSrc = logoImg || '/logo.png';
    const avatarSrc = profile.photo_url || '';
    const initials = profile.initials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'EP');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Executive Personnel Dossier - ${profile.name || 'Employee'}</title>
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
              font-size: 12px;
              line-height: 1.5;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 14px;
              border-bottom: 3px solid #07162c;
              margin-bottom: 16px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .logo-box {
              width: 52px;
              height: 52px;
              border-radius: 12px;
              border: 1px solid #cbd5e1;
              padding: 6px;
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
              font-size: 18px;
              font-weight: 900;
              color: #07162c;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin: 0;
            }
            .company-sub {
              font-size: 10px;
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
              font-size: 9px;
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
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              margin: 0;
            }
            .gen-date {
              font-size: 10px;
              color: #64748b;
              margin: 2px 0 0 0;
            }
            .hero-card {
              background: #07162c;
              color: #ffffff;
              border-radius: 14px;
              padding: 18px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .hero-left {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .avatar-box {
              width: 64px;
              height: 64px;
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.15);
              border: 2px solid rgba(255, 255, 255, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
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
              font-size: 20px;
              font-weight: 900;
              margin: 0;
              color: #ffffff;
            }
            .status-pill {
              display: inline-block;
              background: rgba(16, 185, 129, 0.25);
              color: #6ee7b7;
              border: 1px solid rgba(16, 185, 129, 0.4);
              font-size: 10px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 12px;
              margin-left: 8px;
            }
            .hero-sub {
              font-size: 12px;
              color: #cbd5e1;
              margin: 3px 0 0 0;
            }
            .hero-meta {
              display: flex;
              gap: 14px;
              margin-top: 6px;
              font-size: 11px;
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
              padding: 10px 14px;
              text-align: center;
            }
            .tenure-val {
              font-size: 16px;
              font-weight: 900;
              color: #ffffff;
              display: block;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 16px;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 10px;
            }
            .stat-label {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: block;
            }
            .stat-val {
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
              display: block;
              margin-top: 2px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 16px;
            }
            .section-card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
            }
            .section-header {
              background: #f1f5f9;
              padding: 7px 12px;
              font-size: 10px;
              font-weight: 800;
              color: #07162c;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #e2e8f0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            td {
              padding: 6px 12px;
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
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 16px;
            }
            .contact-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              padding: 12px;
            }
            .footer-sig {
              margin-top: 24px;
              padding-top: 14px;
              border-top: 2px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .sig-line {
              border-bottom: 1px solid #64748b;
              width: 160px;
              text-align: center;
              font-style: italic;
              color: #64748b;
              font-size: 10px;
              padding-bottom: 3px;
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
              <p class="ref-no">REF: PWH/EMP/${new Date().getFullYear()}/${profile.emp_code || profile.id || '001'}</p>
              <p class="gen-date">Date: ${generatedDate}</p>
            </div>
          </div>

          <div class="hero-card">
            <div class="hero-left">
              <div class="avatar-box">
                ${avatarSrc ? `<img src="${avatarSrc}" alt="${profile.name}" />` : initials}
              </div>
              <div>
                <h2 class="hero-title">${profile.name || 'Employee Profile'} <span class="status-pill">● ${profile.status || 'Active'}</span></h2>
                <p class="hero-sub">${profile.designation || 'Employee'} • ${profile.department || 'General'}</p>
                <div class="hero-meta">
                  <span>Emp Code: <strong>${profile.emp_code || '-'}</strong></span>
                  <span>Joined: <strong>${formattedJoined}</strong></span>
                  <span>Role: <strong>${profile.role || 'Employee'}</strong></span>
                </div>
              </div>
            </div>
            <div class="tenure-box">
              <span style="font-size:9px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Tenure</span>
              <span class="tenure-val">${tenureText !== '-' ? tenureText : 'New Staff'}</span>
            </div>
          </div>

          <div class="grid-4">
            <div class="stat-card">
              <span class="stat-label">Designation</span>
              <span class="stat-val">${profile.designation || '-'}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Joined Date</span>
              <span class="stat-val">${formattedJoined}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Date of Birth</span>
              <span class="stat-val">${formattedDob}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Years of Service</span>
              <span class="stat-val">${tenureText}</span>
            </div>
          </div>

          <div class="grid-2">
            <div class="section-card">
              <div class="section-header">Personal Information</div>
              <table>
                <tr><td class="lbl">Full Name</td><td class="val">${profile.name || '-'}</td></tr>
                <tr><td class="lbl">NIC / National ID</td><td class="val" style="font-family:monospace">${profile.nic || '-'}</td></tr>
                <tr><td class="lbl">Date of Birth</td><td class="val">${formattedDob} (${ageText !== '-' ? `${ageText} yrs` : '-'})</td></tr>
                <tr><td class="lbl">Gender</td><td class="val">${profile.gender || '-'}</td></tr>
              </table>
            </div>

            <div class="section-card">
              <div class="section-header">Employment Details</div>
              <table>
                <tr><td class="lbl">Employee Code</td><td class="val" style="font-family:monospace">${profile.emp_code || '-'}</td></tr>
                <tr><td class="lbl">Department</td><td class="val">${profile.department || '-'}</td></tr>
                <tr><td class="lbl">Designation</td><td class="val">${profile.designation || '-'}</td></tr>
                <tr><td class="lbl">Employment Type</td><td class="val">${profile.employment_type || 'Full Time'}</td></tr>
              </table>
            </div>
          </div>

          <div class="full-width-card">
            <div class="section-header">Contact & Location Details</div>
            <div class="contact-grid">
              <div>
                <span class="stat-label">Phone Number</span>
                <span class="stat-val" style="font-family:monospace">${profile.phone || '-'}</span>
              </div>
              <div>
                <span class="stat-label">Official Email</span>
                <span class="stat-val">${profile.email || '-'}</span>
              </div>
              <div>
                <span class="stat-label">Personal Email</span>
                <span class="stat-val">${profile.personal_email || '-'}</span>
              </div>
              <div style="grid-column: span 3;">
                <span class="stat-label">Residential Address</span>
                <span class="stat-val">${profile.address || '-'}</span>
              </div>
            </div>
          </div>

          <div class="footer-sig">
            <div>
              <p style="font-size:11px; font-weight:700; color:#047857; margin:0;">✔ AUTHENTICATED BY P W HOLDINGS HR SYSTEM</p>
              <p style="font-size:10px; color:#94a3b8; margin:2px 0 0 0;">Confidential personnel record property of P W Holdings (Pvt) Ltd.</p>
            </div>
            <div style="text-align:center;">
              <div class="sig-line">Electronically Verified</div>
              <span style="font-weight:700; font-size:11px; display:block;">Manager - Human Resources</span>
              <span style="font-size:10px; color:#64748b;">P W Holdings (Pvt) Ltd</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .fixed, .fixed * {
            position: static !important;
            display: block !important;
            transform: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #printable-employee-report, #printable-employee-report * {
            visibility: visible !important;
          }
          #printable-employee-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Modal Controls (Hidden during printing) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Executive Profile Dossier</h3>
              <p className="text-xs text-slate-500 font-medium">Print-ready official company record preview</p>
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

        {/* PRINTABLE DOSSIER REPORT CONTENT */}
        <div id="printable-employee-report" className="bg-white text-slate-800 space-y-6">
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
            {/* Table A: Personal Details */}
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

            {/* Table B: Employment Details */}
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

          {/* 5. Contact Information Block */}
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

          {/* 6. Document Footer with HR Authorization Signature Block */}
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
