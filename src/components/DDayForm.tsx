import { useState } from 'react';
import type { DDay } from '../types';
import { v4 as uuid } from 'uuid';
import { formatDateForInput } from '../utils/time';
import HolidaySuggest from './HolidaySuggest';

interface DDayFormProps {
  onAdd: (dday: DDay) => void;
  onClose: () => void;
  initialData?: Partial<DDay>;
}

type FormMode = 'manual' | 'suggest';

export default function DDayForm({ onAdd, onClose, initialData }: DDayFormProps) {
  const defaultTarget = new Date();
  defaultTarget.setDate(defaultTarget.getDate() + 30);

  const [mode, setMode] = useState<FormMode>('manual');
  const [title, setTitle] = useState(initialData?.title || '');
  const [targetDate, setTargetDate] = useState(
    initialData?.targetDate
      ? formatDateForInput(new Date(initialData.targetDate))
      : formatDateForInput(defaultTarget)
  );
  const [sleepHours, setSleepHours] = useState(initialData?.sleepHours ?? 7);
  const [capsuleMessage, setCapsuleMessage] = useState('');
  const [showCapsule, setShowCapsule] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dday: DDay = {
      id: uuid(),
      title: title.trim(),
      targetDate: new Date(targetDate).toISOString(),
      startDate: initialData?.startDate || new Date().toISOString(),
      sleepHours,
      createdAt: new Date().toISOString(),
      capsuleMessage: capsuleMessage.trim() || undefined,
    };

    onAdd(dday);
  };

  const handleSuggestSelect = (name: string, date: string) => {
    setTitle(name);
    setTargetDate(formatDateForInput(new Date(date)));
    setMode('manual');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New D-Day</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="form-mode-toggle">
          <button
            className={`mode-pill ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
            type="button"
          >
            직접 입력
          </button>
          <button
            className={`mode-pill ${mode === 'suggest' ? 'active' : ''}`}
            onClick={() => setMode('suggest')}
            type="button"
          >
            추천
          </button>
        </div>

        {mode === 'suggest' ? (
          <HolidaySuggest onSelect={handleSuggestSelect} />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Project Deadline, Birthday, Exam..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetDate">Target Date & Time</label>
              <input
                id="targetDate"
                type="datetime-local"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sleepHours">
                Average Sleep Hours: <strong>{sleepHours}h</strong>
              </label>
              <input
                id="sleepHours"
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
              />
              <div className="range-labels">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Time Capsule */}
            <div className="form-group">
              <button
                type="button"
                className="capsule-toggle"
                onClick={() => setShowCapsule(!showCapsule)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 8l10 6 10-6" />
                </svg>
                미래의 나에게 보내는 메시지
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ marginLeft: 'auto', transform: showCapsule ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showCapsule && (
                <textarea
                  className="capsule-textarea"
                  placeholder="D-Day가 완료되면 이 메시지가 공개됩니다..."
                  value={capsuleMessage}
                  onChange={(e) => setCapsuleMessage(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={4}
                />
              )}
              {showCapsule && (
                <span className="capsule-char-count">{capsuleMessage.length}/500</span>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create D-Day
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
