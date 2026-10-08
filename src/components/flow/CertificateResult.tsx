import { certificateConfig } from '../../config/certificate';
import type { GeneratedCertificate } from '../../hooks/useCertificateFlow';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { Spinner } from '../ui/Spinner';
import styles from './CertificateResult.module.css';

interface CertificateResultProps {
  certificate: GeneratedCertificate | null;
  isGenerating: boolean;
  generationFailed: boolean;
  downloading: 'pdf' | 'png' | null;
  downloadFailed: boolean;
  onRetry: () => void;
  onDownload: (format: 'pdf' | 'png') => void;
  onChooseAnother: () => void;
  onNewSearch: () => void;
}

export function CertificateResult({
  certificate,
  isGenerating,
  generationFailed,
  downloading,
  downloadFailed,
  onRetry,
  onDownload,
  onChooseAnother,
  onNewSearch,
}: CertificateResultProps) {
  if (generationFailed) {
    return (
      <Notice
        tone="warning"
        title="تعذّر إصدار الشهادة."
        actions={
          <>
            <Button icon="refresh" onClick={onRetry}>
              حاول مرة أخرى
            </Button>
            <Button variant="secondary" icon="back" onClick={onChooseAnother}>
              العودة للفعاليات
            </Button>
          </>
        }
      >
        تأكد من اتصالك بالإنترنت ثم أعد المحاولة.
      </Notice>
    );
  }

  const ready = Boolean(certificate) && !isGenerating;

  return (
    <div className={styles.result}>
      <figure className={styles.frame} style={{ aspectRatio: `${certificateConfig.width} / ${certificateConfig.height}` }}>
        {ready && certificate ? (
          <img
            src={certificate.previewUrl}
            alt={`شهادة ${certificate.participantName} — ${certificate.event.title}`}
            className={styles.preview}
          />
        ) : (
          <div className={styles.placeholder} role="status">
            <Spinner size={28} />
            <span>جارٍ إصدار الشهادة…</span>
          </div>
        )}
      </figure>

      {ready && certificate && (
        <p className={styles.caption}>
          شهادة <bdi dir="auto"><strong>{certificate.event.title}</strong></bdi>
        </p>
      )}

      <div className={styles.downloads}>
        <Button
          icon="file"
          onClick={() => onDownload('pdf')}
          disabled={!ready || downloading !== null}
          loading={downloading === 'pdf'}
          loadingLabel="جارٍ تجهيز PDF…"
        >
          تحميل PDF
        </Button>
        <Button
          variant="secondary"
          icon="image"
          onClick={() => onDownload('png')}
          disabled={!ready || downloading !== null}
          loading={downloading === 'png'}
          loadingLabel="جارٍ التحميل…"
        >
          تحميل صورة
        </Button>
      </div>

      {downloadFailed && (
        <p className={styles.error} role="alert">
          تعذّر تجهيز الملف. حاول مرة أخرى.
        </p>
      )}

      <div className={styles.more}>
        <Button variant="ghost" icon="search" onClick={onNewSearch}>
          بحث جديد
        </Button>
      </div>
    </div>
  );
}
