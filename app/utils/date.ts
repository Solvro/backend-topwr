import { DateTime } from "luxon";

export function convertDateOrFallbackToNow(dateString: string): DateTime<true> {
  const date = DateTime.fromISO(dateString);
  return date.isValid ? date : DateTime.now();
}
