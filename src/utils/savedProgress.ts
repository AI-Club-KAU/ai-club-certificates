import type { EventMatch, ParticipantQuery } from '../types';

/**
 * Remembers where the participant is, so leaving the page (switching apps to send
 * something, a mobile browser reloading the tab, a refresh) returns them to the same
 * step with the same data.
 *
 * Stored in sessionStorage: kept for this browser tab only and cleared when the tab is
 * closed, so the next person on a shared computer does not see someone else's data.
 * "بحث جديد" clears it immediately.
 */
export interface SavedProgress {
  page: 'verify' | 'events' | 'certificate';
  draft: ParticipantQuery;
  searchedQuery: ParticipantQuery | null;
  matches: EventMatch[];
  selectedEventId: string | null;
  savedAt: number;
}

const STORAGE_KEY = 'aiClubCertificateProgress';
/** Older progress is ignored (e.g. the tab was left open overnight). */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function loadProgress(): SavedProgress | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProgress;
    if (!saved || typeof saved !== 'object' || Date.now() - saved.savedAt > MAX_AGE_MS) return null;
    if (!['verify', 'events', 'certificate'].includes(saved.page) || !Array.isArray(saved.matches)) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveProgress(progress: Omit<SavedProgress, 'savedAt'>): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode, blocked storage); the site still works without it.
  }
}

export function clearProgress(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
