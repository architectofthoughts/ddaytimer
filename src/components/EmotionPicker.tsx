import type { EmotionLevel } from '../types';

const EMOTIONS: { level: EmotionLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '\uD83D\uDE30', label: '불안' },
  { level: 2, emoji: '\uD83D\uDE1F', label: '걱정' },
  { level: 3, emoji: '\uD83D\uDE10', label: '보통' },
  { level: 4, emoji: '\uD83D\uDE0A', label: '기대' },
  { level: 5, emoji: '\uD83D\uDD25', label: '자신감' },
];

interface EmotionPickerProps {
  currentLevel?: EmotionLevel;
  onSelect: (level: EmotionLevel) => void;
}

export default function EmotionPicker({ currentLevel, onSelect }: EmotionPickerProps) {
  return (
    <div className="emotion-picker">
      <span className="emotion-picker-label">오늘의 감정</span>
      <div className="emotion-picker-buttons">
        {EMOTIONS.map(({ level, emoji, label }) => (
          <button
            key={level}
            className={`emotion-btn ${currentLevel === level ? 'active' : ''}`}
            onClick={() => onSelect(level)}
            title={label}
            type="button"
          >
            <span className="emotion-emoji">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
