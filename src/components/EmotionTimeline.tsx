import type { EmotionEntry } from '../types';

const EMOTION_EMOJIS: Record<number, string> = {
  1: '\uD83D\uDE30',
  2: '\uD83D\uDE1F',
  3: '\uD83D\uDE10',
  4: '\uD83D\uDE0A',
  5: '\uD83D\uDD25',
};

interface EmotionTimelineProps {
  entries: EmotionEntry[];
  startDate: string;
  targetDate: string;
}

export default function EmotionTimeline({ entries, startDate, targetDate }: EmotionTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="emotion-timeline-empty">
        오늘의 감정을 기록해보세요
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(startDate).getTime();
  const end = new Date(targetDate).getTime();
  const range = end - start;

  const width = 280;
  const height = 100;
  const padX = 20;
  const padY = 15;
  const graphW = width - padX * 2;
  const graphH = height - padY * 2;

  const points = sorted.map(entry => {
    const entryTime = new Date(entry.date + 'T12:00:00').getTime();
    const x = padX + (range > 0 ? Math.min(Math.max((entryTime - start) / range, 0), 1) * graphW : graphW / 2);
    const y = padY + graphH - ((entry.level - 1) / 4) * graphH;
    return { x, y, entry };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="emotion-timeline">
      <span className="emotion-timeline-label">감정 변화</span>
      <svg viewBox={`0 0 ${width} ${height}`} className="emotion-timeline-svg">
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map(level => {
          const y = padY + graphH - ((level - 1) / 4) * graphH;
          return (
            <line
              key={level}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="var(--border-color)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}
        {/* Line */}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* Dots with emojis */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
          >
            {EMOTION_EMOJIS[p.entry.level]}
          </text>
        ))}
      </svg>
    </div>
  );
}
