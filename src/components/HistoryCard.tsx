import type { ArchivedDDay } from '../types';
import { formatDuration } from '../utils/time';

interface HistoryCardProps {
  item: ArchivedDDay;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export default function HistoryCard({ item, onRestore, onPermanentDelete }: HistoryCardProps) {
  const startStr = new Date(item.startDate).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const completedStr = new Date(item.completedAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="history-card">
      <h4 className="history-card-title">{item.title}</h4>
      <div className="history-card-dates">
        <span>{startStr}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <span>{completedStr}</span>
      </div>
      <div className="history-card-duration">
        {formatDuration(item.totalDurationMs)}
      </div>
      <div className="history-card-actions">
        <button className="btn-secondary btn-sm" onClick={() => onRestore(item.id)}>
          복원
        </button>
        <button className="btn-danger btn-sm" onClick={() => onPermanentDelete(item.id)}>
          삭제
        </button>
      </div>
    </div>
  );
}
