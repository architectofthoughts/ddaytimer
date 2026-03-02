import { useState } from 'react';
import { holidays2026, exams2026, anniversaryTemplates } from '../data/koreanHolidays';

type Category = 'holiday' | 'exam' | 'anniversary';

interface HolidaySuggestProps {
  onSelect: (name: string, date: string) => void;
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

export default function HolidaySuggest({ onSelect }: HolidaySuggestProps) {
  const [category, setCategory] = useState<Category>('holiday');
  const [baseDate, setBaseDate] = useState('');
  const today = todayStr();

  const renderCards = () => {
    if (category === 'holiday') {
      return holidays2026.map(h => {
        const isPast = h.date < today;
        return (
          <button
            key={h.id}
            className={`suggest-card ${isPast ? 'past' : ''}`}
            onClick={() => onSelect(h.name, h.date + 'T00:00:00')}
          >
            <span className="suggest-icon">{h.icon}</span>
            <span className="suggest-name">{h.name}</span>
            <span className="suggest-date">{h.date}</span>
            {isPast && <span className="suggest-badge">지남</span>}
          </button>
        );
      });
    }

    if (category === 'exam') {
      return exams2026.map(e => {
        const isPast = e.date < today;
        return (
          <button
            key={e.id}
            className={`suggest-card ${isPast ? 'past' : ''}`}
            onClick={() => onSelect(e.name, e.date + 'T00:00:00')}
          >
            <span className="suggest-icon">{e.icon}</span>
            <span className="suggest-name">{e.name}</span>
            <span className="suggest-date">{e.date}</span>
            {isPast && <span className="suggest-badge">지남</span>}
          </button>
        );
      });
    }

    // Anniversary
    if (!baseDate) {
      return (
        <div className="suggest-base-date">
          <label>기준일을 선택하세요</label>
          <input
            type="date"
            value={baseDate}
            onChange={e => setBaseDate(e.target.value)}
          />
        </div>
      );
    }

    return anniversaryTemplates.map(tmpl => {
      const d = new Date(baseDate + 'T00:00:00');
      d.setDate(d.getDate() + tmpl.daysFromBase);
      const dateStr = d.toLocaleDateString('en-CA');
      const isPast = dateStr < today;
      return (
        <button
          key={tmpl.id}
          className={`suggest-card ${isPast ? 'past' : ''}`}
          onClick={() => onSelect(`${tmpl.label} 기념일`, dateStr + 'T00:00:00')}
        >
          <span className="suggest-icon">{tmpl.icon}</span>
          <span className="suggest-name">{tmpl.label}</span>
          <span className="suggest-date">{dateStr}</span>
          {isPast && <span className="suggest-badge">지남</span>}
        </button>
      );
    });
  };

  return (
    <div className="holiday-suggest">
      <div className="suggest-tabs">
        {([
          ['holiday', '공휴일'],
          ['exam', '시험'],
          ['anniversary', '기념일'],
        ] as [Category, string][]).map(([cat, label]) => (
          <button
            key={cat}
            className={`suggest-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {category === 'anniversary' && (
        <div className="suggest-base-input">
          <label>기준일</label>
          <input
            type="date"
            value={baseDate}
            onChange={e => setBaseDate(e.target.value)}
          />
        </div>
      )}
      <div className="suggest-list">
        {category !== 'anniversary' || baseDate ? renderCards() : (
          <p className="suggest-empty">기준일을 입력하면 기념일이 자동 계산됩니다</p>
        )}
      </div>
    </div>
  );
}
