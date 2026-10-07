import React from 'react';
import { PartyPopper, Cake, Sparkles } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: 'Good Morning',   emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening',   emoji: '🌆' };
  return                                { text: 'Good Night',     emoji: '🌙' };
}

function checkIsBirthdayToday(dobStr) {
  if (!dobStr) return false;
  try {
    const raw = String(dobStr).split('T')[0];
    const parts = raw.split('-');
    if (parts.length < 3) return false;
    const dobMonth = parseInt(parts[1], 10);
    const dobDay = parseInt(parts[2], 10);

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDay = today.getDate();

    return dobMonth === currentMonth && dobDay === currentDay;
  } catch {
    return false;
  }
}

export default function GreetingBanner({ user }) {
  const { text: greetingText, emoji: greetingEmoji } = getGreeting();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const isBirthday = checkIsBirthdayToday(user?.dob);

  if (isBirthday) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-amber-400/40 relative overflow-hidden mb-6 animate-in fade-in duration-300">
        {/* Decorative Sparkles & Cake Background */}
        <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none text-white">
          <Cake className="w-40 h-40" />
        </div>
        <div className="absolute top-2 right-12 opacity-15 pointer-events-none text-white animate-pulse">
          <Sparkles className="w-24 h-24" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md text-amber-100 text-[11px] font-extrabold px-3 py-1 rounded-full border border-white/30 flex items-center gap-1.5 shadow-xs">
              <PartyPopper className="w-3.5 h-3.5 text-amber-200" />
              <span>HAPPY BIRTHDAY TO YOU! 🎉</span>
            </span>
            <span className="text-xs text-amber-100/90 font-medium hidden sm:inline">{formattedDate}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex flex-wrap items-center gap-2 tracking-tight">
            <span>Happy Birthday, {firstName}!</span>
            <span className="inline-block animate-bounce text-2xl">🎂</span>
            <span className="inline-block animate-pulse text-2xl">🎁</span>
          </h2>

          <p className="text-xs sm:text-sm text-amber-100/95 font-medium mt-2 leading-relaxed max-w-2xl">
            Wishing you a wonderful birthday filled with joy, laughter, and great achievements! May this year bring you continued success and happiness! Have a fantastic day from all of us at P W Holdings! ✨🎈
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#022851] text-white rounded-2xl p-6 shadow-sm border border-blue-900 relative overflow-hidden mb-6">
      {/* Date Header */}
      <p className="text-xs font-medium text-blue-200/90">{formattedDate}</p>

      {/* Main Greeting */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
        {greetingText}, {firstName} <span className="inline-block animate-bounce">{greetingEmoji}</span>
      </h2>
    </div>
  );
}
