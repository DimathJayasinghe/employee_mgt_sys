import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Mail, Send, Sparkles, CheckCircle2, Phone } from 'lucide-react';

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

export default function SendMessageModal({ isOpen, onClose, profile }) {
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [copied, setCopied] = useState(false);

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Employee';
  const e164Phone = normalizeE164(profile?.phone);
  const recipientEmail = profile?.email || profile?.personal_email || '';

  const templates = [
    {
      id: 'birthday',
      title: '🎂 Birthday Wishes',
      subject: `Happy Birthday ${firstName}! - P W Holdings`,
      text: `Warmest Happy Birthday wishes, ${firstName}! 🎂🎉 On behalf of the entire P W Holdings team, we wish you a fantastic day and a wonderful year ahead!`
    },
    {
      id: 'work',
      title: '💼 Work Log Inquiry',
      subject: `Work Activity Update - P W Holdings`,
      text: `Hello ${firstName}, hope you are doing well! Please ensure your daily work description entry for today is updated in the employee portal.`
    },
    {
      id: 'documents',
      title: '📄 Document Request',
      subject: `Personnel Document Update Request`,
      text: `Hi ${firstName}, please submit your updated personnel documents (NIC copy / Certificates) to the HR portal at your earliest convenience.`
    },
    {
      id: 'appreciation',
      title: '🌟 Great Work Appreciation',
      subject: `Great Contribution Thank You!`,
      text: `Great work, ${firstName}! Your dedication and contributions to P W Holdings make a real difference. Keep up the excellent work!`
    }
  ];

  useEffect(() => {
    if (profile) {
      // Default initial message
      setMessage(`Hello ${firstName}, hope you are doing well!`);
      setSubject(`Message from P W Holdings - ${profile.name}`);
      setChannel(e164Phone ? 'whatsapp' : 'email');
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  const handleSelectTemplate = (tpl) => {
    setMessage(tpl.text);
    setSubject(tpl.subject);
  };

  const handleSendWhatsApp = () => {
    if (!e164Phone) return;
    const url = `https://wa.me/${e164Phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleSendEmail = () => {
    if (!recipientEmail) return;
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Send Message</h3>
              <p className="text-xs text-slate-500 font-medium">Reach out via WhatsApp or Direct Email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Profile Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.initials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'EP')
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{profile.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium">{profile.department || 'General'} • {profile.designation || 'Employee'}</p>
            </div>
          </div>

          <div className="text-right text-[10px] font-mono text-slate-500">
            {profile.phone ? <span className="block text-emerald-700 font-bold">{profile.phone}</span> : <span className="block text-slate-400">No phone</span>}
            {recipientEmail && <span className="block truncate max-w-[140px] text-blue-700">{recipientEmail}</span>}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            disabled={!e164Phone}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              channel === 'whatsapp'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                : e164Phone
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('email')}
            disabled={!recipientEmail}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              channel === 'email'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : recipientEmail
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Direct Email</span>
          </button>
        </div>

        {/* Quick Message Templates */}
        <div className="mt-4">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Message Templates</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl p-2 text-xs font-semibold text-slate-700 transition-colors"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form Controls */}
        <div className="mt-4 space-y-3">
          {channel === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Message Text</span>
              <span className="text-[10px] text-slate-400 font-mono">{message.length} chars</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {channel === 'whatsapp' ? (
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!e164Phone || !message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!recipientEmail || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via Email</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
