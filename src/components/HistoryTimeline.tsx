import type { ArchivedDDay } from '../types';
import HistoryCard from './HistoryCard';

interface HistoryTimelineProps {
  items: ArchivedDDay[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export default function HistoryTimeline({ items, onRestore, onPermanentDelete }: HistoryTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="history-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
          <path d="M10 12h4" />
        </svg>
        <p>아직 완료된 D-Day가 없습니다</p>
      </div>
    );
  }

  // Sort by completedAt descending
  const sorted = [...items].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  // Group by year
  const groups: Record<string, ArchivedDDay[]> = {};
  for (const item of sorted) {
    const year = new Date(item.completedAt).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  }

  return (
    <div className="history-timeline">
      {Object.entries(groups).map(([year, yearItems]) => (
        <div key={year} className="history-year-group">
          <div className="history-year-header">{year}</div>
          <div className="history-year-items">
            {yearItems.map(item => (
              <div key={item.id} className="history-timeline-item">
                <div className="history-timeline-dot" />
                <HistoryCard
                  item={item}
                  onRestore={onRestore}
                  onPermanentDelete={onPermanentDelete}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
