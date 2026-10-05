// Date utilities operating strictly in Asia/Colombo timezone using Intl.DateTimeFormat parts and dob.split('-')

const TIMEZONE = 'Asia/Colombo';

// Get current date/time components in Asia/Colombo timezone
export function getNowColombo() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);

  return { year, month, day, hour, minute, second };
}

// Parse YYYY-MM-DD using dob.split('-') without new Date(string)
export function parseDateParts(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

// Format YYYY-MM-DD -> DD.MM.YYYY
export function formatDateDot(dateStr) {
  const parsed = parseDateParts(dateStr);
  if (!parsed) return '-';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}.${mm}.${parsed.year}`;
}

// Format Birthday as "31 March" style
export function formatBirthdayStyle(dobStr) {
  const parsed = parseDateParts(dobStr);
  if (!parsed) return 'Birthday not set';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[parsed.month - 1] || '';
  return `${parsed.day} ${monthName}`;
}

// Calculate Tenure (Years & Months) dynamically from date_joined
export function calculateTenure(joinedStr) {
  const joined = parseDateParts(joinedStr);
  if (!joined) return { text: '-', years: 0, months: 0, shortText: '-' };

  const now = getNowColombo();

  let totalMonths = (now.year - joined.year) * 12 + (now.month - joined.month);
  if (now.day < joined.day) {
    totalMonths--;
  }
  totalMonths = Math.max(0, totalMonths);

  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  let text = '';
  if (years > 0 && remMonths > 0) {
    text = `(${years} ${years === 1 ? 'Year' : 'Years'} ${remMonths} ${remMonths === 1 ? 'Month' : 'Months'})`;
  } else if (years > 0) {
    text = `(${years} ${years === 1 ? 'Year' : 'Years'})`;
  } else {
    text = `(${remMonths} ${remMonths === 1 ? 'Month' : 'Months'})`;
  }

  let shortText = '';
  if (years > 0 && remMonths > 0) {
    shortText = `${years} yrs ${remMonths} mos`;
  } else if (years > 0) {
    shortText = `${years} ${years === 1 ? 'Year' : 'Years'}`;
  } else {
    shortText = `${remMonths} ${remMonths === 1 ? 'Month' : 'Months'}`;
  }

  return { text, years, months: remMonths, totalMonths, shortText };
}

// Birthday Countdown in Asia/Colombo time
// Checks if current time is:
// 1) On birthday day -> returns { isToday: true }
// 2) Between 12:00 and 24:00 the day before birthday -> returns { isEve: true, hoursLeft: N }
// 3) Otherwise -> returns { daysLeft: N, nextBirthdayFormatted: 'DD Month' }
export function getBirthdayCountdown(dobStr) {
  const dob = parseDateParts(dobStr);
  if (!dob) return null;

  const now = getNowColombo();

  // Handle Feb 29 for non-leap years
  let bMonth = dob.month;
  let bDay = dob.day;
  const isLeapYear = (now.year % 4 === 0 && now.year % 100 !== 0) || (now.year % 400 === 0);
  if (bMonth === 2 && bDay === 29 && !isLeapYear) {
    bDay = 28;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 1. Is today the birthday?
  if (now.month === bMonth && now.day === bDay) {
    return {
      status: 'today',
      isToday: true,
      displayDate: `${bDay} ${monthNames[bMonth - 1]}`
    };
  }

  // Calculate day difference within current year or next year
  let targetYear = now.year;
  if (now.month > bMonth || (now.month === bMonth && now.day > bDay)) {
    targetYear = now.year + 1;
  }

  // Convert dates to UTC day index for accurate day delta calculation
  const nowDayIndex = Date.UTC(now.year, now.month - 1, now.day) / (24 * 3600 * 1000);
  const targetDayIndex = Date.UTC(targetYear, bMonth - 1, bDay) / (24 * 3600 * 1000);
  const daysDiff = Math.round(targetDayIndex - nowDayIndex);

  // 2. Is tomorrow the birthday (daysDiff === 1) and time is between 12:00 and 24:00?
  if (daysDiff === 1 && now.hour >= 12) {
    // Hours until midnight (start of birthday)
    const hoursLeft = 24 - now.hour;
    return {
      status: 'eve',
      isEve: true,
      hoursLeft: Math.max(1, hoursLeft),
      displayDate: `${bDay} ${monthNames[bMonth - 1]}`
    };
  }

  // 3. Otherwise standard upcoming countdown
  return {
    status: 'upcoming',
    daysLeft: daysDiff,
    displayDate: `${bDay} ${monthNames[bMonth - 1]}`
  };
}

// Age in years from DOB
export function getAge(dobStr) {
  const parsed = parseDateParts(dobStr);
  if (!parsed) return '-';
  const now = getNowColombo();
  let age = now.year - parsed.year;
  if (now.month < parsed.month || (now.month === parsed.month && now.day < parsed.day)) {
    age--;
  }
  return age >= 0 ? age : '-';
}

// Tenure short text helper
export function getTenure(joinedStr) {
  const res = calculateTenure(joinedStr);
  return res ? res.shortText : '-';
}

// Display date helper
export function formatDisplayDate(dateStr) {
  return formatDateDot(dateStr);
}
