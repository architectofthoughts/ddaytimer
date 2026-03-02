import type { TimeRemaining } from '../types';
import FlipDigit from './FlipDigit';

interface CountdownDisplayProps {
  time: TimeRemaining;
  label: string;
  compact?: boolean;
}

export default function CountdownDisplay({ time, label, compact }: CountdownDisplayProps) {
  if (time.isComplete) {
    return (
      <div className="countdown-display complete">
        <h3 className="countdown-label">{label}</h3>
        <div className="countdown-complete-text">TIME'S UP!</div>
      </div>
    );
  }

  return (
    <div className={`countdown-display ${compact ? 'compact' : ''}`}>
      <h3 className="countdown-label">{label}</h3>
      <div className="flip-digits-row">
        <FlipDigit value={time.days} label="DAYS" />
        <span className="flip-separator">:</span>
        <FlipDigit value={time.hours} label="HRS" />
        <span className="flip-separator">:</span>
        <FlipDigit value={time.minutes} label="MIN" />
        <span className="flip-separator">:</span>
        <FlipDigit value={time.seconds} label="SEC" />
      </div>
    </div>
  );
}
