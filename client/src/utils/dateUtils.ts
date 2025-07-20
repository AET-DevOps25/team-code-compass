/**
 * Converts a Date object to YYYY-MM-DD format in LOCAL timezone
 * (avoids timezone conversion issues that cause date shifting)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date in YYYY-MM-DD format in LOCAL timezone
 */
export function getTodayLocalDate(): string {
  return formatDateForAPI(new Date());
}

/**
 * Gets a date offset by specified days in YYYY-MM-DD format in LOCAL timezone
 */
export function getDateOffsetLocal(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateForAPI(date);
} 