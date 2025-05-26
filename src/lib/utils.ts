import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | string | undefined): string {
  if (num === undefined || num === null) return '0';
  const numericVal = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(numericVal)) return '0';

  if (numericVal >= 1000000000) {
    return (numericVal / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (numericVal >= 1000000) {
    return (numericVal / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (numericVal >= 1000) {
    return (numericVal / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return numericVal.toString();
}

export function parseISO8601Duration(durationStr: string | undefined): string {
  if (!durationStr) return "0:00";
  // Matches PTnM, PTnHnM, PTnHnMnS, PTnMnS, PTnHnS, PTnS
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = durationStr.match(regex);

  if (!matches) return "0:00";

  const hours = matches[1] ? parseInt(matches[1]) : 0;
  const minutes = matches[2] ? parseInt(matches[2]) : 0;
  const seconds = matches[3] ? parseInt(matches[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  if (minutes > 0 || seconds > 0 || hours > 0) { // ensure 0:00 for PT0S, or PT
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return "0:00"; // Default for PT or empty duration
}

export function formatPublishedAt(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", error);
    return " awhile ago"; // Fallback
  }
}
