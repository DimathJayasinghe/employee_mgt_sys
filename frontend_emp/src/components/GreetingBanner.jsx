import React from 'react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: 'Good Morning',   emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening',   emoji: '🌆' };
  return                                { text: 'Good Night',     emoji: '🌙' };
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

  return (
    <div className="bg-[#022851] text-white rounded-2xl p-6 shadow-sm border border-blue-900 relative overflow-hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {/* Date Header */}
        <p className="text-xs font-medium text-blue-200/90">{formattedDate}</p>

        {/* Main Greeting with Profile Photo */}
        <div className="flex items-center gap-3.5 mt-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-400/20 text-white font-black text-sm sm:text-base flex items-center justify-center border-2 border-white/30 shrink-0 overflow-hidden shadow-xs">
            {user?.photo_url ? (
              <img src={user.photo_url} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'EP')
            )}
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{greetingText}, {firstName}</span> <span className="inline-block animate-bounce">{greetingEmoji}</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
