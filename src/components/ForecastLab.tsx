import { useState } from 'react';
import type { ArchivedDDay, DDay, EmotionEntry } from '../types';
import {
  buildForecastBase,
  evaluateForecastScenario,
} from '../utils/forecastLab';

interface ForecastLabProps {
  dday: DDay | undefined;
  archivedDdays: ArchivedDDay[];
  emotionEntries: EmotionEntry[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number): number {
  return Math.round(value * 100);
}

export default function ForecastLab({
  dday,
  archivedDdays,
  emotionEntries,
}: ForecastLabProps) {
  const base = dday ? buildForecastBase(dday, emotionEntries, archivedDdays) : null;
  const [focusShare, setFocusShare] = useState(() =>
    base ? Number(base.recommendedShare.toFixed(2)) : 0.24
  );
  const [recoveryDays, setRecoveryDays] = useState(() =>
    base && base.remainingDays > 4 ? 1 : 0
  );

  if (!dday || !base) {
    return (
      <section className="mission-panel mission-panel-wide mission-forecast-panel">
        <div className="mission-panel-header">
          <div>
            <span className="mission-panel-kicker">Forecast Lab</span>
            <h3>선택된 일정 없음</h3>
          </div>
        </div>
        <div className="mission-panel-empty">
          활성 D-Day를 선택하면 남은 시간, 수면 시간, 최근 감정 로그를 합쳐 실험적인 페이스 시뮬레이션을 보여줍니다.
        </div>
      </section>
    );
  }

  const scenario = evaluateForecastScenario(base, focusShare, recoveryDays);
  const maxRecoveryDays = Math.min(4, Math.max(0, base.remainingDays - 1));
  const presets = [
    {
      id: 'buffer',
      label: '버퍼',
      description: '회복 여유를 먼저 확보',
      focusShare: clamp(base.recommendedShare - 0.05, 0.12, 0.5),
      recoveryDays: Math.min(maxRecoveryDays, base.remainingDays > 6 ? 2 : 1),
    },
    {
      id: 'balanced',
      label: '균형',
      description: '권장 페이스 유지',
      focusShare: base.recommendedShare,
      recoveryDays: Math.min(maxRecoveryDays, base.remainingDays > 4 ? 1 : 0),
    },
    {
      id: 'sprint',
      label: '스프린트',
      description: '단기 압축 운영',
      focusShare: clamp(base.recommendedShare + 0.08, 0.16, 0.55),
      recoveryDays: 0,
    },
  ];

  return (
    <section className="mission-panel mission-panel-wide mission-forecast-panel">
      <div className="mission-panel-header">
        <div>
          <span className="mission-panel-kicker">Forecast Lab</span>
          <h3>{dday.title}</h3>
        </div>
        <span className="mission-panel-note">
          권장 {toPercent(base.recommendedShare)}% / {base.recommendedHoursPerDay.toFixed(1)}h
        </span>
      </div>

      <div className={`forecast-status status-${scenario.status}`}>
        <div>
          <span className="forecast-status-label">{scenario.statusLabel}</span>
          <h4>{scenario.statusCopy}</h4>
        </div>
        <strong>{scenario.confidence}%</strong>
      </div>

      <p className="forecast-copy">{scenario.guidance}</p>

      <div className="forecast-presets">
        {presets.map(preset => {
          const isActive =
            toPercent(preset.focusShare) === toPercent(focusShare) &&
            preset.recoveryDays === recoveryDays;

          return (
            <button
              key={preset.id}
              type="button"
              className={`forecast-preset ${isActive ? 'active' : ''}`}
              onClick={() => {
                setFocusShare(Number(preset.focusShare.toFixed(2)));
                setRecoveryDays(preset.recoveryDays);
              }}
            >
              <span>{preset.label}</span>
              <small>{preset.description}</small>
            </button>
          );
        })}
      </div>

      <div className="forecast-controls">
        <label className="forecast-control">
          <div className="forecast-control-header">
            <span>집중 비율</span>
            <strong>{toPercent(focusShare)}%</strong>
          </div>
          <input
            className="forecast-range"
            type="range"
            min="12"
            max="55"
            step="1"
            value={toPercent(focusShare)}
            onChange={(event) => setFocusShare(Number(event.target.value) / 100)}
          />
          <div className="forecast-control-meta">
            <span>권장 {toPercent(base.recommendedShare)}%</span>
            <span>하루 {scenario.focusHoursPerDay.toFixed(1)}h 집중</span>
          </div>
        </label>

        <label className="forecast-control">
          <div className="forecast-control-header">
            <span>회복일</span>
            <strong>{recoveryDays}일</strong>
          </div>
          <input
            className="forecast-range"
            type="range"
            min="0"
            max={maxRecoveryDays}
            step="1"
            value={recoveryDays}
            onChange={(event) => setRecoveryDays(Number(event.target.value))}
          />
          <div className="forecast-control-meta">
            <span>실집중 가능 {scenario.productiveDays.toFixed(1)}일</span>
            <span>{maxRecoveryDays}일까지 조정</span>
          </div>
        </label>
      </div>

      <div className="forecast-metric-grid">
        <article className="forecast-metric-card">
          <span className="forecast-metric-label">실행 커버리지</span>
          <strong>{Math.round(scenario.coverageRatio * 100)}%</strong>
          <p>권장 페이스 대비 확보되는 집중 시간</p>
        </article>
        <article className="forecast-metric-card">
          <span className="forecast-metric-label">버너웃 리스크</span>
          <strong>{scenario.burnoutLabel}</strong>
          <p>{scenario.burnoutRisk}% 수준으로 계산</p>
        </article>
        <article className="forecast-metric-card">
          <span className="forecast-metric-label">실행 런웨이</span>
          <strong>{scenario.runwayLabel}</strong>
          <p>{scenario.focusMixLabel}</p>
        </article>
      </div>

      <div className="forecast-signal-list">
        <div className="forecast-signal">
          <span>감정 신호</span>
          <strong>{base.moodSignalLabel}</strong>
        </div>
        <div className="forecast-signal">
          <span>사이클 비교</span>
          <strong>{base.benchmarkLabel}</strong>
        </div>
        <div className="forecast-signal">
          <span>진행률 기준</span>
          <strong>{Math.round(base.progressPercent)}% 진행, 남은 {base.remainingDays}일</strong>
        </div>
      </div>
    </section>
  );
}
