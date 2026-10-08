import { useCallback, useEffect, useRef, useState } from 'react';
import { buildCertificateContent } from '../certificate/certificateContent';
import { canvasToPngBlob, certificateFileName, downloadBlob, pngToPdfBlob } from '../certificate/exportCertificate';
import { renderCertificate } from '../certificate/renderCertificate';
import { AttendanceApiError } from '../services/apiError';
import { findCertificates } from '../services/attendanceApi';
import type { EventMatch, ParticipantQuery } from '../types';
import { cleanName, normalizeEmail } from '../utils/normalize';
import { clearProgress, loadProgress, saveProgress } from '../utils/savedProgress';

/**
 * The flow has three pages. The participant can move back and forward between
 * them (buttons, step indicator, or the browser's back/forward), and everything
 * entered so far is kept until they start a new search.
 *
 *   verify ──(attendance found)──▶ events ──(certificate issued)──▶ certificate
 *
 * The verify page also has a status: idle, searching, not-found or error.
 */
export type FlowPage = 'verify' | 'events' | 'certificate';
export type VerifyStatus = 'idle' | 'searching' | 'not-found' | 'error';
export type ErrorKind = AttendanceApiError['kind'] | 'unknown';

export const PAGE_ORDER: FlowPage[] = ['verify', 'events', 'certificate'];

export interface GeneratedCertificate {
  event: EventMatch;
  participantName: string;
  previewUrl: string;
  png: Blob;
}

const EMPTY_QUERY: ParticipantQuery = { fullName: '', email: '' };
const HISTORY_KEY = 'aiClubPage';

function sameQuery(a: ParticipantQuery, b: ParticipantQuery): boolean {
  return cleanName(a.fullName) === cleanName(b.fullName) && normalizeEmail(a.email) === normalizeEmail(b.email);
}

export function useCertificateFlow() {
  // Progress saved before the participant left the page (see utils/savedProgress.ts).
  const [restored] = useState(loadProgress);

  const [page, setPage] = useState<FlowPage>(restored?.page ?? 'verify');
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [errorKind, setErrorKind] = useState<ErrorKind>('unknown');
  /** Re-mounts the form (clears its validation messages) on a new search. */
  const [formKey, setFormKey] = useState(0);

  /** What is typed in the form right now. */
  const [draft, setDraft] = useState<ParticipantQuery>(restored?.draft ?? EMPTY_QUERY);
  /** The details the current results belong to. */
  const [searchedQuery, setSearchedQuery] = useState<ParticipantQuery | null>(restored?.searchedQuery ?? null);
  const [matches, setMatches] = useState<EventMatch[]>(restored?.matches ?? []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(restored?.selectedEventId ?? null);

  const [certificate, setCertificate] = useState<GeneratedCertificate | null>(null);
  // A restored certificate page re-draws the certificate on load (images are not stored).
  const [isGenerating, setIsGenerating] = useState(restored?.page === 'certificate');
  const [generationFailed, setGenerationFailed] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'png' | null>(null);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const pdfCache = useRef<{ eventId: string; blob: Blob } | null>(null);

  // ---- Which pages can be opened ------------------------------------------

  const resultsMatchDraft = searchedQuery !== null && sameQuery(searchedQuery, draft);
  const canOpenEvents = matches.length > 0 && resultsMatchDraft;
  const canOpenCertificate =
    canOpenEvents && certificate !== null && certificate.event.eventId === selectedEventId;

  const canOpen = useCallback(
    (target: FlowPage) =>
      target === 'verify' || (target === 'events' && canOpenEvents) || (target === 'certificate' && canOpenCertificate),
    [canOpenEvents, canOpenCertificate],
  );

  // ---- Browser history (back / forward buttons) ---------------------------

  const canOpenRef = useRef(canOpen);
  canOpenRef.current = canOpen;

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: pageRef.current }, '');
    const onPopState = (event: PopStateEvent) => {
      const target = (event.state?.[HISTORY_KEY] as FlowPage | undefined) ?? 'verify';
      setPage(canOpenRef.current(target) ? target : 'verify');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** Shows a page and records it in the browser history. */
  const pageRef = useRef(page);
  pageRef.current = page;

  const goTo = useCallback((target: FlowPage, options: { force?: boolean } = {}) => {
    if (!options.force && !canOpenRef.current(target)) return;
    if (pageRef.current !== target) window.history.pushState({ [HISTORY_KEY]: target }, '');
    pageRef.current = target;
    setPage(target);
  }, []);

  const goBack = useCallback(() => {
    const index = PAGE_ORDER.indexOf(page);
    if (index > 0) goTo(PAGE_ORDER[index - 1]);
  }, [page, goTo]);

  const goNext = useCallback(() => {
    const index = PAGE_ORDER.indexOf(page);
    if (index < PAGE_ORDER.length - 1) goTo(PAGE_ORDER[index + 1]);
  }, [page, goTo]);

  // Save progress whenever it changes, so leaving and coming back resumes here.
  useEffect(() => {
    if (page === 'verify' && !draft.fullName && !draft.email && !searchedQuery) {
      clearProgress();
      return;
    }
    saveProgress({ page, draft, searchedQuery, matches, selectedEventId });
  }, [page, draft, searchedQuery, matches, selectedEventId]);

  // Release the preview image when it is replaced or the page unmounts.
  useEffect(() => {
    const url = certificate?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [certificate?.previewUrl]);

  // ---- Actions -------------------------------------------------------------

  const updateDraft = useCallback((next: ParticipantQuery) => {
    setDraft(next);
    setVerifyStatus((status) => (status === 'not-found' || status === 'error' ? 'idle' : status));
  }, []);

  const verify = useCallback(
    async (input: ParticipantQuery) => {
      setDraft(input);
      setVerifyStatus('searching');
      try {
        const found = await findCertificates(input);
        const isSameSearch = searchedQuery !== null && sameQuery(searchedQuery, input);
        setSearchedQuery(input);
        setMatches(found);
        if (!isSameSearch) {
          setCertificate(null);
          pdfCache.current = null;
          setSelectedEventId(found.length === 1 ? found[0].eventId : null);
        } else if (!found.some((m) => m.eventId === selectedEventId)) {
          setSelectedEventId(found.length === 1 ? found[0].eventId : null);
        }
        if (found.length) {
          setVerifyStatus('idle');
          goTo('events', { force: true });
        } else {
          setVerifyStatus('not-found');
        }
      } catch (error) {
        setErrorKind(error instanceof AttendanceApiError ? error.kind : 'unknown');
        setVerifyStatus('error');
      }
    },
    [goTo, searchedQuery, selectedEventId],
  );

  const generate = useCallback(async () => {
    const event = matches.find((m) => m.eventId === selectedEventId);
    if (!event) return;

    // Already issued for this event: just show it again.
    if (certificate?.event.eventId === event.eventId) {
      goTo('certificate', { force: true });
      return;
    }

    setIsGenerating(true);
    setGenerationFailed(false);
    setDownloadFailed(false);
    goTo('certificate', { force: true });
    try {
      const content = buildCertificateContent(event, draft.fullName);
      const canvas = await renderCertificate(content);
      const png = await canvasToPngBlob(canvas);
      pdfCache.current = null;
      setCertificate({ event, participantName: content.name, png, previewUrl: URL.createObjectURL(png) });
    } catch (error) {
      console.error(error);
      setGenerationFailed(true);
    } finally {
      setIsGenerating(false);
    }
  }, [matches, selectedEventId, certificate, draft.fullName, goTo]);

  const download = useCallback(
    async (format: 'pdf' | 'png') => {
      if (!certificate) return;
      setDownloading(format);
      setDownloadFailed(false);
      try {
        const fileName = certificateFileName(certificate.participantName, format);
        if (format === 'png') {
          downloadBlob(certificate.png, fileName);
          return;
        }
        if (pdfCache.current?.eventId !== certificate.event.eventId) {
          const blob = await pngToPdfBlob(certificate.png, `شهادة — ${certificate.event.title}`);
          pdfCache.current = { eventId: certificate.event.eventId, blob };
        }
        downloadBlob(pdfCache.current.blob, fileName);
      } catch (error) {
        console.error(error);
        setDownloadFailed(true);
      } finally {
        setDownloading(null);
      }
    },
    [certificate],
  );

  // Returning to a saved certificate page: draw the certificate again.
  const restoreHandled = useRef(false);
  useEffect(() => {
    if (restoreHandled.current) return;
    restoreHandled.current = true;
    if (restored?.page === 'certificate') {
      if (restored.matches.some((m) => m.eventId === restored.selectedEventId)) void generate();
      else {
        setIsGenerating(false);
        setPage('events');
      }
    }
  }, [restored, generate]);

  /** "بحث جديد": clears everything and returns to an empty first page. */
  const startOver = useCallback(() => {
    clearProgress();
    setDraft(EMPTY_QUERY);
    setSearchedQuery(null);
    setMatches([]);
    setSelectedEventId(null);
    setCertificate(null);
    setGenerationFailed(false);
    setDownloadFailed(false);
    setVerifyStatus('idle');
    pdfCache.current = null;
    setFormKey((key) => key + 1);
    goTo('verify', { force: true });
  }, [goTo]);

  return {
    page,
    verifyStatus,
    errorKind,
    formKey,
    draft,
    matches,
    selectedEventId,
    certificate,
    isGenerating,
    generationFailed,
    downloading,
    downloadFailed,
    canOpen,
    goTo,
    goBack,
    goNext,
    updateDraft,
    verify,
    selectEvent: setSelectedEventId,
    generate,
    download,
    startOver,
  };
}