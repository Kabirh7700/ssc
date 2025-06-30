
import { StageHistoryItem } from '../types';
import { OrderStatus } from '../constants';

/**
 * Parses a date string from various common formats into a JavaScript Date object.
 * Supports ISO 8601, MM/DD/YYYY, DD/MM/YYYY (with / or -), and numeric timestamps (sec/ms).
 * @param dateInput The date string or number to parse.
 * @returns A Date object if parsing is successful, otherwise null.
 */
export const parseDateString = (dateInput?: string | null | number): Date | null => {
  if (dateInput === undefined || dateInput === null) return null;

  let trimmedDateString: string;
  if (typeof dateInput === 'number') {
    // If it's a number, assume it's a timestamp
    // A common cutoff: year 2000 in seconds is 946684800, in ms is 946684800000.
    if (dateInput < 3000000000) { // Likely seconds
      const dateFromTimestampSec = new Date(dateInput * 1000);
      if (!isNaN(dateFromTimestampSec.getTime())) return dateFromTimestampSec;
    } else { // Likely milliseconds
      const dateFromTimestampMs = new Date(dateInput);
      if (!isNaN(dateFromTimestampMs.getTime())) return dateFromTimestampMs;
    }
    trimmedDateString = String(dateInput); // Fallback to string parsing if number wasn't a valid timestamp
  } else {
    trimmedDateString = dateInput.trim();
  }
  
  if (!trimmedDateString) return null;

  // Attempt 1: Direct ISO or JS recognizable format including YYYY-MM-DD
  let date = new Date(trimmedDateString);
  if (!isNaN(date.getTime())) {
    // Further validation for YYYY-MM-DD to avoid JS Date quirks with timezones
    // If it only contains date parts and no time, JS might interpret it as UTC.
    // For "YYYY-MM-DD", ensure it parses as local date.
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedDateString)) {
        const parts = trimmedDateString.split('-').map(Number);
        const testDate = new Date(parts[0], parts[1] - 1, parts[2]); // local
        if (testDate.getFullYear() === parts[0] && testDate.getMonth() === parts[1] - 1 && testDate.getDate() === parts[2]) {
             return testDate;
        }
    }
    return date;
  }

  // Attempt 2: Numeric string (already handled if input was number, this is for stringified timestamps)
  if (/^\d+$/.test(trimmedDateString) && typeof dateInput === 'string') {
    const num = Number(trimmedDateString);
    if (num < 3000000000) { 
      date = new Date(num * 1000);
    } else { 
      date = new Date(num);
    }
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Attempt 3: Common non-ISO formats (MM/DD/YYYY, DD/MM/YYYY with / or -)
  const partsRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = trimmedDateString.match(partsRegex);

  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Try MM/DD/YYYY (common in US)
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) { // p1 is month, p2 is day
      date = new Date(year, p1 - 1, p2); // Month is 0-indexed
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === p1 - 1 && date.getDate() === p2) {
        return date;
      }
    }
    // Try DD/MM/YYYY (common elsewhere)
    if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) { // p1 is day, p2 is month
      date = new Date(year, p2 - 1, p1);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === p2 - 1 && date.getDate() === p1) {
        return date;
      }
    }
  }
  
  // If all attempts fail
  console.warn(`Could not parse date string: "${dateInput}" into a valid Date object.`);
  return null;
};


/**
 * Formats a date string or Date object for display.
 * @param dateInput The date string (various formats) or Date object.
 * @returns Formatted date string or 'Invalid Date' / 'N/A'.
 */
export const formatDate = (dateInput?: string | Date | null | number): string => {
  if (dateInput === undefined || dateInput === null || (typeof dateInput === 'string' && dateInput.trim() === '')) {
    return 'N/A';
  }
  
  let dateToFormat: Date | null;

  if (dateInput instanceof Date) {
    dateToFormat = dateInput;
  } else {
    dateToFormat = parseDateString(dateInput);
  }
  
  if (!dateToFormat || isNaN(dateToFormat.getTime())) {
    return 'Invalid Date';
  }

  try {
    return dateToFormat.toLocaleDateString(undefined, { // Use undefined for locale to use browser's default
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting date:", e, "Original input:", dateInput);
    return 'Invalid Date';
  }
};


export const daysBetween = (dateStr1?: string | Date, dateStr2?: string | Date): number | null => {
  if (!dateStr1 || !dateStr2) return null;
  try {
    const d1 = (dateStr1 instanceof Date) ? dateStr1 : parseDateString(dateStr1);
    const d2 = (dateStr2 instanceof Date) ? dateStr2 : parseDateString(dateStr2);

    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    
    // To ensure whole days, normalize to midnight of each date
    const date1Normalized = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2Normalized = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

    const differenceInTime = date2Normalized.getTime() - date1Normalized.getTime();
    return Math.round(differenceInTime / (1000 * 3600 * 24));
  } catch (e) {
    console.error("Error in daysBetween:", e, dateStr1, dateStr2);
    return null;
  }
};

export const getStageDate = (
  stageHistory: StageHistoryItem[],
  targetStage: OrderStatus,
  dateType: 'start' | 'end' = 'start'
): string | undefined => {
  const historyItem = stageHistory.find(item => item.stage === targetStage);
  if (!historyItem) return undefined;
  return dateType === 'start' ? historyItem.startDate : historyItem.endDate;
};

export const addDaysToDate = (dateInput: string | Date, days: number): string => {
  try {
    const baseDate = (dateInput instanceof Date) ? dateInput : parseDateString(dateInput);
    if (!baseDate || isNaN(baseDate.getTime())) throw new Error("Invalid base date for addDaysToDate");

    const resultDate = new Date(baseDate);
    resultDate.setDate(resultDate.getDate() + days);
    return resultDate.toISOString();
  } catch (e) {
    console.error("Error in addDaysToDate:", e, dateInput, days);
    // Fallback to original if string, or throw if critical
    return typeof dateInput === 'string' ? dateInput : new Date().toISOString(); 
  }
};
