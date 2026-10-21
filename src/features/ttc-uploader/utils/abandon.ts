/**
 * TTC rule: an ongoing story with no new chapter for this many days is "vô hố" (abandoned),
 * and another translator may claim it. Re-uploading any chapter resets the clock.
 */
export const ABANDON_DAYS = 12;

/** Default for "needs a reup": stories updated at least this many days ago are preselected. */
export const DEFAULT_REUP_FROM_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since `lastUpdated`, or null when TTC sent no (readable) date. */
export function daysSinceUpdate(lastUpdated: string | null | undefined, now: number): number | null {
  if (!lastUpdated) return null;
  const time = new Date(lastUpdated).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((now - time) / DAY_MS));
}

export type AbandonRisk = 'unknown' | 'safe' | 'soon' | 'overdue';

/** `soon` = due for a reup: at least `reupFromDays` days without a new chapter. */
export function abandonRisk(days: number | null, reupFromDays: number): AbandonRisk {
  if (days === null) return 'unknown';
  if (days >= ABANDON_DAYS) return 'overdue';
  if (days >= reupFromDays) return 'soon';
  return 'safe';
}

/** Chapter titles as TTC and the local parser may differ in spacing and case only. */
export function sameChapterTitle(a: string, b: string): boolean {
  const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi');
  return norm(a) === norm(b);
}
