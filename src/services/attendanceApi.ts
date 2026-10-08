import { env } from '../config/env';
import type { EventMatch, ParticipantQuery } from '../types';
import { cleanName, normalizeEmail } from '../utils/normalize';
import { AttendanceApiError, type ApiErrorKind } from './apiError';

interface ApiSuccess {
  ok: true;
  data: { matches: EventMatch[] };
}
interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
}
type ApiResponse = ApiSuccess | ApiFailure;

const REQUEST_TIMEOUT_MS = 25_000;

/**
 * Returns every event where the participant has an ATTENDANCE record matching
 * both name and email. An empty array means no attendance was found.
 */
export async function findCertificates(query: ParticipantQuery): Promise<EventMatch[]> {
  const payload = { fullName: cleanName(query.fullName), email: normalizeEmail(query.email) };

  if (env.useMockApi) {
    // Loaded on demand so the fictional data never ships in a production build.
    const { findCertificatesMock } = await import('./mock/mockAttendanceApi');
    return findCertificatesMock(payload);
  }
  if (!env.attendanceApiUrl) {
    throw new AttendanceApiError('not-configured', 'VITE_ATTENDANCE_API_URL is not set.');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(env.attendanceApiUrl, {
      method: 'POST',
      // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'findCertificates', ...payload }),
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (error) {
    // Logged to help diagnose deployment problems (wrong URL, access not set to "Anyone", …).
    console.error('[AI Club] Request to the attendance API failed:', env.attendanceApiUrl, error);
    throw new AttendanceApiError('network', 'Could not reach the attendance API.');
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) throw new AttendanceApiError('server', `HTTP ${response.status}`);

  let body: ApiResponse;
  try {
    body = (await response.clone().json()) as ApiResponse;
  } catch {
    console.error('[AI Club] The API did not return JSON. First part of the response:', (await response.text()).slice(0, 300));
    throw new AttendanceApiError('server', 'The API did not return JSON.');
  }

  if (!body.ok) {
    const kind: ApiErrorKind = body.error?.code === 'INVALID_INPUT' ? 'invalid-input' : 'server';
    throw new AttendanceApiError(kind, body.error?.message ?? 'Unknown API error.');
  }
  return Array.isArray(body.data?.matches) ? body.data.matches.map(sanitizeMatch) : [];
}

/** Guards the UI against missing fields if the sheet has gaps. */
function sanitizeMatch(match: Partial<EventMatch>): EventMatch {
  return {
    eventId: String(match.eventId ?? ''),
    title: String(match.title ?? '').trim(),
    type: String(match.type ?? '').trim(),
    section: String(match.section ?? '').trim(),
    role: String(match.role ?? '').trim(),
    delivery: String(match.delivery ?? '').trim(),
    date: typeof match.date === 'string' && match.date ? match.date : null,
    dateRaw: String(match.dateRaw ?? '').trim(),
    participantName: String(match.participantName ?? '').trim(),
  };
}