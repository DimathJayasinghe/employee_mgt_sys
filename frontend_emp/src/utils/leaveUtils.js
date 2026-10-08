// Helper to format HH:MM:SS to 12-hour AM/PM format
export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Helper to format special recurring leave days
export function formatSpecialDays(dayOfWeekStr) {
  if (!dayOfWeekStr) return 'Special Leave';
  const parts = dayOfWeekStr.split(',').map(p => p.trim());
  const formatted = parts.map(part => {
    if (part.includes(':')) {
      const [day, session] = part.split(':');
      return `${day.slice(0, 3)} (${session})`;
    }
    return part;
  });
  return formatted.join(', ');
}

// Helper to determine leave cancellation eligibility on UI
export function getLeaveCancellationStatus(leave) {
  if (!leave) return { canCancel: false, isExpired: false, reason: 'Invalid leave request' };

  if (leave.status !== 'Pending' && leave.status !== 'Approved') {
    return { canCancel: false, isExpired: false, reason: `Leave is already ${leave.status}` };
  }

  const isSpecial = leave.leave_type === 'Special Leave';
  const isPowerCut = leave.leave_type === 'Power Cut';
  if (isSpecial || isPowerCut) {
    return { canCancel: true, isExpired: false, deadlineText: 'Anytime' };
  }

  const startDateStr = leave.start_date ? (typeof leave.start_date === 'string' ? leave.start_date.split('T')[0] : '') : '';
  if (!startDateStr) {
    return { canCancel: true, isExpired: false, deadlineText: 'Standard' };
  }

  let cutoffTimeStr = '08:30:00';
  let deadlineDesc = '8:30 AM on start date';

  if (leave.leave_type === 'Short Leave') {
    let sTime = leave.start_time || '09:00:00';
    if (!leave.start_time && leave.reason) {
      const match = leave.reason.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) sTime = match[1] + ':00';
    }
    cutoffTimeStr = sTime.length === 5 ? sTime + ':00' : sTime;
    deadlineDesc = `${sTime.slice(0, 5)} (start of Short Leave)`;
  } else if (leave.leave_type === 'Half Day') {
    const text = `${leave.special_session || ''} ${leave.reason || ''} ${leave.start_time || ''}`.toLowerCase();
    const isEvening = text.includes('evening') || text.includes('pm') || text.includes('12:30') || text.includes('afternoon');
    if (isEvening) {
      cutoffTimeStr = '12:30:00';
      deadlineDesc = '12:30 PM (start of Evening Session)';
    } else {
      cutoffTimeStr = '08:30:00';
      deadlineDesc = '8:30 AM (start of Morning Session)';
    }
  }

  const fullCutoffTime = cutoffTimeStr.length === 5 ? `${cutoffTimeStr}:00` : cutoffTimeStr;
  const cutoffUtcMs = new Date(`${startDateStr}T${fullCutoffTime}+05:30`).getTime();

  const nowMs = Date.now();
  if (nowMs > cutoffUtcMs) {
    return {
      canCancel: false,
      isExpired: true,
      reason: `Cancellation closed (must be cancelled before ${deadlineDesc} on ${startDateStr})`
    };
  }

  return {
    canCancel: true,
    isExpired: false,
    deadlineText: `Before ${deadlineDesc} on ${startDateStr}`
  };
}
