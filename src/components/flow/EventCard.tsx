import { getDeliveryText, getEventTypeLabel, getRoleLabel } from '../../certificate/certificateContent';
import type { EventMatch } from '../../types';
import { formatDisplayDate } from '../../utils/date';
import { Icon } from '../ui/Icon';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: EventMatch;
  selected: boolean;
  groupName: string;
  onSelect: (eventId: string) => void;
}

/** One attended event, rendered as a selectable card backed by a native radio input. */
export function EventCard({ event, selected, groupName, onSelect }: EventCardProps) {
  const typeLabel = getEventTypeLabel(event.type);
  const roleLabel = getRoleLabel(event.role);
  const delivery = getDeliveryText(event.delivery);
  const date = formatDisplayDate(event.date, event.dateRaw);

  return (
    <label className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <input
        type="radio"
        name={groupName}
        value={event.eventId}
        checked={selected}
        onChange={() => onSelect(event.eventId)}
        className="visually-hidden"
      />
      <span className={styles.check} aria-hidden="true">
        {selected && <Icon name="check" size={16} />}
      </span>
      <span className={styles.content}>
        <span className={styles.chips}>
          {typeLabel && (
            <span className={styles.typeChip}>
              {typeLabel}
              {delivery && ` · ${delivery}`}
            </span>
          )}
          {roleLabel && (
            <span className={styles.roleChip}>
              <Icon name="award" size={14} />
              الدور: {roleLabel}
            </span>
          )}
          {event.section && (
            <span className={styles.sectionChip}>
              <Icon name="users" size={14} />
              الشطر: {event.section}
            </span>
          )}
        </span>
        <span className={styles.title} dir="auto">
          {event.title}
        </span>
        {date && (
          <span className={styles.date}>
            <Icon name="calendar" size={16} />
            {date}
          </span>
        )}
      </span>
    </label>
  );
}
