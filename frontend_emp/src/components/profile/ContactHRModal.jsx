import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Send, MessageSquare, Mail, AlertCircle, CheckCircle2, ShieldAlert, User, Users } from 'lucide-react';
import API from '../../api';

// Helper: Normalize phone number to E.164 (e.g., 0775227748 -> 94775227748)
function normalizeE164(phoneStr) {
  if (!phoneStr) return null;
  const digits = phoneStr.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('0')) {
    return '94' + digits.slice(1);
  } else if (digits.startsWith('94')) {
    return digits;
  }
  return digits;
}

export default function ContactHRModal({ isOpen, onClose, profile }) {
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('all'); // 'all' or admin user id
  const [category, setCategory] = useState('Document Request / Update');
  const [urgency, setUrgency] = useState('Normal'); // 'Normal' | 'High' | 'Urgent'
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
    }
  }, [isOpen]);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await API.get('/profile/admins');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAdmins(res.data);
      } else {
        // Fallback default admins if none returned from db
        setAdmins([
          { id: '1', name: 'HR Department Admin', phone: '0770001122', email: 'hr@pwholdings.lk', designation: 'HR Manager' }
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch admins:', err.message);
      setAdmins([
        { id: '1', name: 'HR Department Admin', phone: '0770001122', email: 'hr@pwholdings.lk', designation: 'HR Manager' }
      ]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  if (!isOpen) return null;

  const employeeName = profile?.name || 'Employee';
  const empCode = profile?.emp_code || profile?.id || '';

  const categories = [
    { id: 'docs', label: '📄 Document Request / Update' },
    { id: 'leave', label: '🌴 Leave & Attendance Inquiry' },
    { id: 'payroll', label: '💰 Payroll & Salary Query' },
    { id: 'it', label: '🛠️ IT & System Support' },
    { id: 'general', label: '❓ General HR Inquiry' }
  ];

  const selectedAdmin = selectedAdminId !== 'all'
    ? admins.find(a => String(a.id) === String(selectedAdminId))
    : null;

  const logTicketToActivity = async (channel, targetAdminName) => {
    try {
      const desc = `Sent HR request to ${targetAdminName} via ${channel} [Urgency: ${urgency}] (${category}): ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`;
      await API.post('/profile/contact-hr', {
        category,
        urgency,
        message,
        channel,
        target_admin: targetAdminName,
        user_id: profile?.id
      });
    } catch (err) {
      console.warn('Activity logging warning:', err.message);
    }
  };

  const handleSendWhatsAppToAdmin = async (adminObj) => {
    if (!message.trim()) {
      setErrorMsg('Please describe your inquiry before sending.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const targetPhone = normalizeE164(adminObj?.phone) || '94770001122';
    const targetName = adminObj?.name || 'HR Admin';

    const fullText = `*HR Support Request - P W Holdings*\n\n` +
      `*To:* ${targetName}\n` +
      `*From:* ${employeeName} (Emp ID: ${empCode})\n` +
      `*Category:* ${category}\n` +
      `*Urgency:* ${urgency}\n\n` +
      `*Message:* ${message}`;

    await logTicketToActivity(`WhatsApp (${targetName})`, targetName);

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank');

    setSuccessMsg(`WhatsApp chat opened for ${targetName}! Logged in activity.`);
    setTimeout(() => {
      setSuccessMsg('');
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  const handleSendEmail = async () => {
    if (!message.trim()) {
      setErrorMsg('Please describe your inquiry before sending.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    let recipientEmails = [];
    let targetDesc = 'All Admins';

    if (selectedAdmin) {
      const e = selectedAdmin.email || selectedAdmin.personal_email;
      if (e) recipientEmails.push(e);
      targetDesc = selectedAdmin.name;
    } else {
      recipientEmails = admins
        .map(a => a.email || a.personal_email)
        .filter(Boolean);
    }

    if (recipientEmails.length === 0) {
      recipientEmails = ['hr@pwholdings.lk'];
    }

    const subject = `[HR Support - ${urgency}] ${category} - ${employeeName}`;
    const body = `Dear HR Team / Management,\n\nI am submitting a support request regarding:\n\n` +
      `Employee: ${employeeName} (Emp ID: ${empCode})\n` +
      `Recipient: ${targetDesc}\n` +
      `Category: ${category}\n` +
      `Urgency Level: ${urgency}\n\n` +
      `Details:\n${message}\n\nThank you,\n${employeeName}`;

    await logTicketToActivity('Email', targetDesc);

    const mailtoUrl = `mailto:${recipientEmails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    setSuccessMsg(`Email client opened to ${targetDesc}! Logged in activity.`);
    setTimeout(() => {
      setSuccessMsg('');
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Contact HR / Admin Support</h3>
              <p className="text-xs text-slate-500 font-medium">Send inquiry to Company Administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          
          {/* Target Admin Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Recipient Admin</span>
              <span className="text-[10px] text-indigo-600 font-semibold">{admins.length} Admins Available</span>
            </label>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="all">👥 All Admins ({admins.length} Management Admins)</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  👤 {adm.name} ({adm.designation || 'Admin'})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Inquiry Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Level Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['Normal', 'High', 'Urgent'].map((lvl) => {
                const isSelected = urgency === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? lvl === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : lvl === 'High'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Text Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Inquiry Details / Description</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question, request, or issue in detail..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* WhatsApp Direct Action Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp Direct Messaging</label>
            {selectedAdmin ? (
              /* Single Admin WhatsApp button */
              <button
                type="button"
                onClick={() => handleSendWhatsAppToAdmin(selectedAdmin)}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp {selectedAdmin.name} ({selectedAdmin.phone || 'No phone'})</span>
              </button>
            ) : (
              /* All Admins WhatsApp Buttons List */
              <div className="space-y-2">
                {admins.map((adm) => (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => handleSendWhatsAppToAdmin(adm)}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>{adm.name} <span className="text-[10px] text-slate-500 font-normal">({adm.designation || 'Admin'})</span></span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-200/80 px-2 py-0.5 rounded-md">{adm.phone || 'Contact'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email Broadcast / Direct Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSubmitting}
              className="w-full bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>
                {selectedAdmin
                  ? `Email ${selectedAdmin.name}`
                  : `Broadcast Email to All ${admins.length} Admins`}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
