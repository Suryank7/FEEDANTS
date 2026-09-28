/**
 * Date utility functions.
 * All backend dates are in UTC; display conversions happen here.
 */

/**
 * Format a date for display (e.g., "10 Aug 26")
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
}

/**
 * Format time for display (e.g., "11:50 PM")
 */
export function formatTime(dateString) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Format date and time together (e.g., "10 Aug 26, 11:50 PM")
 */
export function formatDateTime(dateString) {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

/**
 * Calculate countdown from now to a target date.
 * Returns { days, hours, minutes, seconds, totalMs, expired }
 */
export function getCountdown(targetDate) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

/**
 * Format countdown as string (e.g., "01d : 06h : 28m : 32s")
 */
export function formatCountdown(countdown) {
  if (countdown.expired) return '00d : 00h : 00m : 00s';
  
  const d = String(countdown.days).padStart(2, '0');
  const h = String(countdown.hours).padStart(2, '0');
  const m = String(countdown.minutes).padStart(2, '0');
  const s = String(countdown.seconds).padStart(2, '0');
  
  return `${d}d : ${h}h : ${m}m : ${s}s`;
}
