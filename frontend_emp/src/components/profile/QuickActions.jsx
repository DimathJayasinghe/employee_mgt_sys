import React, { useState } from 'react';
import { Edit3, FileText, MessageSquare, Printer, ShieldCheck, HelpCircle } from 'lucide-react';
import ReportModal from './ReportModal';
import SendMessageModal from './SendMessageModal';
import ContactHRModal from './ContactHRModal';

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

export default function QuickActions({ profile, onOpenEditModal, onOpenDocumentsTab }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [isContactHROpen, setIsContactHROpen] = useState(false);

  const e164Phone = normalizeE164(profile?.phone);
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const whatsappUrl = e164Phone
    ? `https://wa.me/${e164Phone}?text=${encodeURIComponent(`Hello ${firstName}, hope you are doing well!`)}`
    : null;

  const currentUser = (() => {
    try {
      const saved = localStorage.getItem('emp_mgt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const isAdmin = currentUser?.role === 'Admin';
  const isViewingOther = Boolean(
    currentUser?.id && profile?.id && String(currentUser.id) !== String(profile.id)
  );

  // Show "Send Message" button ONLY if logged-in user is Admin viewing another employee's profile
  const showSendMessage = isAdmin && isViewingOther;

  const handlePrintReport = () => {
    setIsReportOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">Quick Actions</p>
        <h3 className="text-base font-bold text-slate-900 mb-4">Employee Actions</h3>

        <div className="space-y-2.5">
          {/* Action 1: Edit Profile */}
          {onOpenEditModal && (
            <button
              onClick={onOpenEditModal}
              className="w-full bg-[#022851] hover:bg-[#03376e] active:scale-[0.99] text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}

          {/* Action 2: View Documents */}
          <button
            onClick={onOpenDocumentsTab}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>View Documents</span>
          </button>

          {/* Action 3: Send Message Interactive Modal (Admin Viewing Employee Profile) */}
          {showSendMessage ? (
            <button
              onClick={() => setIsSendMessageOpen(true)}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Send Message (WhatsApp / Email)</span>
            </button>
          ) : (
            /* Contact HR Support Modal for Employee Self-Service */
            <button
              onClick={() => setIsContactHROpen(true)}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Contact HR / Support Ticket</span>
            </button>
          )}

          {/* Action 4: Generate Print Report */}
          <button
            onClick={handlePrintReport}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Generate Report (Print/PDF)</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Verified Employee Profile</span>
          </div>
        </div>
      </div>

      {/* Official Executive Dossier Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        profile={profile}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={isSendMessageOpen}
        onClose={() => setIsSendMessageOpen(false)}
        profile={profile}
      />

      {/* Contact HR Modal */}
      <ContactHRModal
        isOpen={isContactHROpen}
        onClose={() => setIsContactHROpen(false)}
        profile={profile}
      />
    </>
  );
}
