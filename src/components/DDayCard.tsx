import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { DDay } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { useEmotionLog } from '../hooks/useEmotionLog';
import { useJourneyInsights } from '../hooks/useJourneyInsights';
import CountdownDisplay from './CountdownDisplay';
import ProgressBar from './ProgressBar';
import FunFacts from './FunFacts';
import ShareButton from './ShareButton';
import TimeCapsuleTeaser from './TimeCapsuleTeaser';
import TimeCapsuleReveal from './TimeCapsuleReveal';
import EmotionPicker from './EmotionPicker';
import EmotionTimeline from './EmotionTimeline';
import MomentumLab from './MomentumLab';

interface DDayCardProps {
  dday: DDay;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
}

export default function DDayCard({ dday, isSelected, onSelect, onDelete, onArchive }: DDayCardProps) {
  const { timeRemaining, awakeTimeRemaining, justCompleted, setJustCompleted } =
    useCountdown(dday.targetDate, dday.sleepHours);
  const { todayEntry, entries, logEmotion } = useEmotionLog(dday.id);
  const journeyInsight = useJourneyInsights(
    dday.startDate,
    dday.targetDate,
    awakeTimeRemaining.total,
    entries,
    timeRemaining.isComplete,
  );
  const [showCapsuleReveal, setShowCapsuleReveal] = useState(false);
  const [autoRevealDone, setAutoRevealDone] = useState(false);

  useEffect(() => {
    if (justCompleted) {
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          setJustCompleted(false);
        }
      };
      frame();

      // Auto-reveal capsule after confetti
      if (dday.capsuleMessage && !autoRevealDone) {
        const timer = setTimeout(() => {
          setShowCapsuleReveal(true);
          setAutoRevealDone(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [justCompleted, setJustCompleted, dday.capsuleMessage, autoRevealDone]);

  if (!isSelected) {
    return (
      <div
        className={`dday-card-mini ${timeRemaining.isComplete ? 'complete' : ''}`}
        onClick={onSelect}
      >
        <div className="dday-card-mini-info">
          <h4>{dday.title}</h4>
          {timeRemaining.isComplete ? (
            <span className="mini-complete">Complete!</span>
          ) : (
            <span className="mini-countdown">
              {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
            </span>
          )}
        </div>
        <button
          className="dday-card-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(dday.id);
          }}
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`dday-card-full ${justCompleted ? 'celebrating' : ''}`}>
      <div className="dday-card-header">
        <h2 className="dday-card-title">{dday.title}</h2>
        <div className="dday-card-actions">
          <ShareButton dday={dday} />
          {timeRemaining.isComplete && onArchive && (
            <button
              className="dday-card-archive"
              onClick={() => onArchive(dday.id)}
              title="아카이브"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="5" rx="1" />
                <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
                <path d="M10 12h4" />
              </svg>
            </button>
          )}
          <button
            className="dday-card-delete"
            onClick={() => onDelete(dday.id)}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="dday-card-target-date">
        {new Date(dday.targetDate).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      <CountdownDisplay time={timeRemaining} label="Total Remaining" />

      {dday.sleepHours > 0 && (
        <CountdownDisplay
          time={awakeTimeRemaining}
          label={`Awake Time (${24 - dday.sleepHours}h/day)`}
          compact
        />
      )}

      {/* Time Capsule Teaser (countdown) */}
      {!timeRemaining.isComplete && dday.capsuleMessage && (
        <TimeCapsuleTeaser />
      )}

      {/* Emotion Picker (countdown only) */}
      {!timeRemaining.isComplete && (
        <EmotionPicker
          currentLevel={todayEntry?.level}
          onSelect={logEmotion}
        />
      )}

      <ProgressBar startDate={dday.startDate} targetDate={dday.targetDate} />

      {/* Emotion Timeline */}
      {entries.length > 0 && (
        <EmotionTimeline
          entries={entries}
          startDate={dday.startDate}
          targetDate={dday.targetDate}
        />
      )}

      <MomentumLab insight={journeyInsight} />

      <FunFacts totalMs={timeRemaining.total} />

      {/* Capsule button for already-completed D-Days */}
      {timeRemaining.isComplete && dday.capsuleMessage && !showCapsuleReveal && (
        <button
          className="btn-secondary capsule-open-btn"
          onClick={() => setShowCapsuleReveal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 8l10 6 10-6" />
          </svg>
          타임캡슐 열기
        </button>
      )}

      {/* Capsule Reveal Modal */}
      {showCapsuleReveal && dday.capsuleMessage && (
        <TimeCapsuleReveal
          message={dday.capsuleMessage}
          onClose={() => setShowCapsuleReveal(false)}
        />
      )}
    </div>
  );
}
