/**
 * Timezone utilities for Asia/Makassar (WITA / UTC+8).
 * All Bounty date calculations and resets are anchored strictly to WITA.
 */

// WITA is UTC+8 (480 minutes ahead of UTC)
const WITA_OFFSET_MINUTES = 8 * 60;

/**
 * Returns current Date adjusted to WITA timezone
 */
export function getWitaDate(date: Date = new Date()): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcTime + WITA_OFFSET_MINUTES * 60000);
}

/**
 * Format Date to YYYY-MM-DD in WITA
 */
export function getWitaDateString(date: Date = new Date()): string {
  const d = getWitaDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns ISO week key like 2026-W35 based on WITA
 */
export function getWitaWeekKey(date: Date = new Date()): string {
  const d = getWitaDate(date);
  // Thursday in current week decides the year.
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7; // Monday is 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = d.getFullYear();
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Returns formatted week range string: e.g. "24 Aug — 30 Aug 2026"
 */
export function getWitaWeekRangeString(date: Date = new Date()): string {
  const d = getWitaDate(date);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const mStart = months[monday.getMonth()];
  const mEnd = months[sunday.getMonth()];
  
  return `${monday.getDate()} ${mStart} — ${sunday.getDate()} ${mEnd} ${sunday.getFullYear()}`;
}

/**
 * Returns Month key like 2026-08 in WITA
 */
export function getWitaMonthKey(date: Date = new Date()): string {
  const d = getWitaDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculate countdown until next WITA daily reset (00:00 WITA)
 */
export function getDailyRemainingCountdown(): string {
  const now = getWitaDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  if (diffMs <= 0) return '0j 0m';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${hours}j ${mins}m`;
}

/**
 * Calculate countdown until next WITA weekly reset (Monday 00:00 WITA)
 */
export function getWeeklyRemainingCountdown(): string {
  const now = getWitaDate();
  const day = now.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const diffMs = nextMonday.getTime() - now.getTime();
  if (diffMs <= 0) return '0h 0j';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return `${days}h ${hours}j`;
}

/**
 * Calculate countdown until next WITA monthly reset (1st of next month 00:00 WITA)
 */
export function getMonthlyRemainingCountdown(): string {
  const now = getWitaDate();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  const diffMs = nextMonth.getTime() - now.getTime();
  if (diffMs <= 0) return '0h 0j';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return `${days}h ${hours}j`;
}

/**
 * Format WITA readable timestamp
 */
export function formatWitaDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const wita = getWitaDate(d);
    const day = wita.getDate();
    const month = months[wita.getMonth()];
    const hours = String(wita.getHours()).padStart(2, '0');
    const mins = String(wita.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${mins} WITA`;
  } catch {
    return isoString;
  }
}
