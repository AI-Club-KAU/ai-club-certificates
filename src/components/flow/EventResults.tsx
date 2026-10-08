import { useId } from 'react';
import type { EventMatch } from '../../types';
import { Button } from '../ui/Button';
import { EventCard } from './EventCard';
import styles from './EventResults.module.css';

interface EventResultsProps {
  participantName: string;
  matches: EventMatch[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  onGenerate: () => void;
}

/** "وجدنا لك شهادتين" — Arabic number agreement for the result count. */
function describeCount(count: number): string {
  if (count === 1) return 'شهادة واحدة';
  if (count === 2) return 'شهادتين';
  if (count <= 10) return `${count} شهادات`;
  return `${count} شهادة`;
}

export function EventResults({ participantName, matches, selectedEventId, onSelect, onGenerate }: EventResultsProps) {
  const groupName = useId();
  const single = matches.length === 1;

  return (
    <div className={styles.results}>
      <p className={styles.lead}>
        أهلًا <bdi><strong>{participantName}</strong></bdi>، وجدنا لك {describeCount(matches.length)}.
        {!single && ' اختر الشهادة التي تريد إصدارها.'}
      </p>

      <div role="radiogroup" aria-label="الشهادات المتاحة" className={styles.list}>
        {matches.map((event) => (
          <EventCard
            key={event.eventId}
            event={event}
            groupName={groupName}
            selected={event.eventId === selectedEventId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button icon="award" onClick={onGenerate} disabled={!selectedEventId} className={styles.primary}>
          إصدار الشهادة
        </Button>
      </div>
      {!selectedEventId && <p className={styles.helper}>اختر شهادة أولًا لإصدارها.</p>}
    </div>
  );
}
