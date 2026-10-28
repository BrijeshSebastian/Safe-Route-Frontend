import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Formats an ISO date string into human-readable format: "21 Oct 2026, 2:42 PM".
 */
export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    if (!isValid(d)) return '—';
    return format(d, 'd MMM yyyy, h:mm a');
  } catch {
    return '—';
  }
}

/**
 * Returns a relative time string (e.g., "5 minutes ago").
 */
export function timeAgo(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export const formatRelativeTime = timeAgo;

/**
 * Formats a numeric distance in kilometers: e.g. "1.2 km" or "450 m".
 */
export function formatDistanceKm(n) {
  const num = Number(n);
  if (isNaN(num) || num < 0) return '—';
  if (num < 1) {
    return `${Math.round(num * 1000)} m`;
  }
  return `${num.toFixed(1)} km`;
}

/**
 * Truncates text with an ellipsis if length exceeds n.
 */
export function truncate(text, n = 50) {
  if (!text) return '';
  if (text.length <= n) return text;
  return text.slice(0, n).trim() + '…';
}

/**
 * Converts snake_case or lowercase string into Title Case.
 */
export function titleCase(text) {
  if (!text) return '';
  return text
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
