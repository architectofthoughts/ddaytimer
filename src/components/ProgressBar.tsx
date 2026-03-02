import { useEffect, useState } from 'react';
import { getProgress } from '../utils/time';

interface ProgressBarProps {
  startDate: string;
  targetDate: string;
}

export default function ProgressBar({ startDate, targetDate }: ProgressBarProps) {
  const [progress, setProgress] = useState(() => getProgress(startDate, targetDate));

  useEffect(() => {
    const update = () => setProgress(getProgress(startDate, targetDate));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate, targetDate]);

  return (
    <div className="progress-section">
      <div className="progress-header">
        <span className="progress-title">Progress</span>
        <span className="progress-percent">{progress.toFixed(2)}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div
          className="progress-bar-glow"
          style={{ left: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="progress-labels">
        <span>Start</span>
        <span>D-Day</span>
      </div>
    </div>
  );
}
