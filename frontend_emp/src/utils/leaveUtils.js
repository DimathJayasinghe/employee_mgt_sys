export function getLeaveCancellationStatus(leave) {
  if (!leave) return { canCancel: false, isExpired: false, reason: 'Invalid leave request' };
  if (leave.status !== 'Pending' && leave.status !== 'Approved') {
    return { canCancel: false, isExpired: false, reason: `Leave is already ${leave.status}` };
  }
  if (leave.leave_type === 'Special Leave' || leave.leave_type === 'Power Cut') {
    return { canCancel: true, isExpired: false, deadlineText: 'Anytime' };
  }

  const startDate = leave.start_date ? leave.start_date.split('T')[0] : '';
  if (!startDate) return { canCancel: true, isExpired: false, deadlineText: 'Standard' };

  let cutoff = '08:30:00';
  let description = '8:30 AM on start date';
  if (leave.leave_type === 'Short Leave') {
    cutoff = leave.start_time || '09:00:00';
    description = `${cutoff.slice(0, 5)} (start of Short Leave)`;
  } else if (leave.leave_type === 'Half Day') {
    const text = `${leave.special_session || ''} ${leave.reason || ''}`.toLowerCase();
    cutoff = text.includes('evening') || text.includes('pm') ? '12:30:00' : '08:30:00';
    description = cutoff === '12:30:00' ? '12:30 PM (start of Evening Session)' : '8:30 AM (start of Morning Session)';
  }

  const deadline = new Date(`${startDate}T${cutoff}`);
  if (Date.now() > deadline.getTime()) {
    return { canCancel: false, isExpired: true, reason: `Cancellation closed (must be cancelled before ${description} on ${startDate})` };
  }
  return { canCancel: true, isExpired: false, deadlineText: `Before ${description} on ${startDate}` };
}