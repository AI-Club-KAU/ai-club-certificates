import { useEffect, useRef } from 'react';
import { CertificateResult } from '../components/flow/CertificateResult';
import { EventResults } from '../components/flow/EventResults';
import { PageNav } from '../components/flow/PageNav';
import { StepIndicator } from '../components/flow/StepIndicator';
import { VerifyForm } from '../components/flow/VerifyForm';
import { PageHero } from '../components/layout/PageHero';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { PAGE_ORDER, useCertificateFlow, type ErrorKind, type FlowPage, type VerifyStatus } from '../hooks/useCertificateFlow';
import { cleanName } from '../utils/normalize';
import styles from './CertificatePage.module.css';

const ERROR_MESSAGES: Record<ErrorKind, { title: string; text: string }> = {
  network: { title: 'تعذّر الاتصال بالخادم.', text: 'تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.' },
  'invalid-input': { title: 'البيانات المدخلة غير صالحة.', text: 'راجع الاسم والبريد الإلكتروني ثم حاول مرة أخرى.' },
  'not-configured': { title: 'خدمة الشهادات غير متاحة حاليًا.', text: 'يرجى المحاولة لاحقًا أو التواصل مع فريق النادي.' },
  server: { title: 'حدث خطأ غير متوقع أثناء التحقق.', text: 'حاول مرة أخرى بعد قليل.' },
  unknown: { title: 'حدث خطأ غير متوقع أثناء التحقق.', text: 'حاول مرة أخرى بعد قليل.' },
};

export function CertificatePage() {
  const flow = useCertificateFlow();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // On every page change: move focus to the new heading (keyboard + screen readers)
  // and bring the card into view on phones.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const heading = headingRef.current;
    heading?.focus({ preventScroll: true });
    const card = heading?.closest('section');
    if (card) {
      const top = card.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [flow.page]);

  useEffect(() => {
    if (flow.errorKind === 'not-configured' && flow.verifyStatus === 'error') {
      console.error('[AI Club] VITE_ATTENDANCE_API_URL is not set. See README → "Connect the frontend to the API".');
    }
  }, [flow.errorKind, flow.verifyStatus]);

  const heading = getHeading(flow.page, flow.verifyStatus, flow.isGenerating);
  const participantName = cleanName(flow.matches[0]?.participantName || flow.draft.fullName);
  const pageIndex = PAGE_ORDER.indexOf(flow.page);
  const nextPage = PAGE_ORDER[pageIndex + 1];

  return (
    <main className={styles.main}>
      <PageHero
        title="إصدار الشهادات"
        subtitle="تحقّق من حضورك لفعاليات نادي الذكاء الاصطناعي، ثم حمّل شهادتك الرسمية بصيغة PDF أو صورة."
      />

      <div className={styles.container}>
        <section className={styles.card} aria-labelledby="panel-heading">
          <StepIndicator current={flow.page} canOpen={flow.canOpen} onOpen={flow.goTo} />

          <header className={styles.panelHeader}>
            <h2 id="panel-heading" ref={headingRef} tabIndex={-1} className={styles.heading}>
              {heading.title}
            </h2>
            {heading.text && <p className={styles.description}>{heading.text}</p>}
          </header>

          <div className={styles.body}>
            {flow.page === 'verify' && (
              <>
                <VerifyForm
                  key={flow.formKey}
                  values={flow.draft}
                  isSubmitting={flow.verifyStatus === 'searching'}
                  onChange={flow.updateDraft}
                  onSubmit={flow.verify}
                />

                {flow.verifyStatus === 'not-found' && (
                  <Notice tone="info" icon="search" title="لم يتم العثور على سجل حضور مطابق للبيانات المدخلة.">
                    تأكد من إدخال الاسم والإيميل المستخدمين عند حضور الفعالية.
                  </Notice>
                )}

                {flow.verifyStatus === 'error' && (
                  <Notice
                    tone="warning"
                    title={ERROR_MESSAGES[flow.errorKind].title}
                    actions={
                      <Button icon="refresh" onClick={() => flow.verify(flow.draft)}>
                        حاول مرة أخرى
                      </Button>
                    }
                  >
                    {ERROR_MESSAGES[flow.errorKind].text}
                  </Notice>
                )}
              </>
            )}

            {flow.page === 'events' && (
              <EventResults
                participantName={participantName}
                matches={flow.matches}
                selectedEventId={flow.selectedEventId}
                onSelect={flow.selectEvent}
                onGenerate={flow.generate}
              />
            )}

            {flow.page === 'certificate' && (
              <CertificateResult
                certificate={flow.certificate}
                isGenerating={flow.isGenerating}
                generationFailed={flow.generationFailed}
                downloading={flow.downloading}
                downloadFailed={flow.downloadFailed}
                onRetry={flow.generate}
                onDownload={flow.download}
                onChooseAnother={flow.goBack}
                onNewSearch={flow.startOver}
              />
            )}
          </div>

          <PageNav
            canGoBack={pageIndex > 0 && flow.verifyStatus !== 'searching' && !flow.isGenerating}
            canGoNext={Boolean(nextPage) && flow.canOpen(nextPage) && flow.verifyStatus !== 'searching'}
            onBack={flow.goBack}
            onNext={flow.goNext}
          />
        </section>
      </div>
    </main>
  );
}

function getHeading(page: FlowPage, status: VerifyStatus, isGenerating: boolean): { title: string; text?: string } {
  switch (page) {
    case 'verify':
      if (status === 'not-found') return { title: 'لا يوجد سجل حضور', text: 'عدّل البيانات ثم أعد التحقق.' };
      if (status === 'error') return { title: 'تعذّر إكمال التحقق' };
      return { title: 'تحقّق من حضورك', text: 'أدخل الاسم والبريد الإلكتروني المستخدمين عند حضور الفعالية.' };
    case 'events':
      return { title: 'شهاداتك المتاحة' };
    case 'certificate':
      return isGenerating
        ? { title: 'جارٍ إصدار شهادتك' }
        : { title: 'شهادتك جاهزة', text: 'راجع الشهادة ثم حمّلها بالصيغة التي تناسبك.' };
  }
}
