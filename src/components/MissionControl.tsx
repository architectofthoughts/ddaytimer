import { useDeferredValue } from 'react';
import type { ArchivedDDay, DDay, EmotionLog } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { buildMissionControlSnapshot } from '../utils/missionControl';
import ForecastLab from './ForecastLab';

interface MissionControlProps {
  ddays: DDay[];
  archivedDdays: ArchivedDDay[];
  selectedId: string | null;
  onFocusDDay: (id: string) => void;
  onCreateDDay: () => void;
}

export default function MissionControl({
  ddays,
  archivedDdays,
  selectedId,
  onFocusDDay,
  onCreateDDay,
}: MissionControlProps) {
  const [emotionLog] = useLocalStorage<EmotionLog>('emotion-log', {});
  const deferredDdays = useDeferredValue(ddays);
  const deferredArchived = useDeferredValue(archivedDdays);
  const highlightedDday = deferredDdays.find(item => item.id === selectedId) ?? deferredDdays[0];
  const snapshot = buildMissionControlSnapshot(
    deferredDdays,
    deferredArchived,
    emotionLog,
    selectedId
  );

  if (snapshot.isEmpty) {
    return (
      <section className="mission-control mission-empty">
        <div className="mission-empty-card">
          <span className="mission-eyebrow">Experiment</span>
          <h2>Mission Control</h2>
          <p>
            활성 D-Day, 감정 로그, 아카이브가 쌓이면 이 화면에서 우선순위와 페이스를
            한 번에 읽을 수 있습니다.
          </p>
          <button className="btn-primary" onClick={onCreateDDay}>
            첫 D-Day 만들기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mission-control">
      <div className="mission-hero">
        <div>
          <span className="mission-eyebrow">Experiment</span>
          <h2 className="mission-title">Mission Control</h2>
          <p className="mission-copy">
            활성 D-Day, 아카이브, 감정 로그를 묶어 우선순위와 마감 페이스를
            운영 화면처럼 보여주는 실험 뷰입니다.
          </p>
        </div>
        <div className="mission-hero-badge">{snapshot.heroLabel}</div>
      </div>

      <div className="mission-stat-grid">
        {snapshot.stats.map(stat => (
          <article
            key={stat.label}
            className={`mission-stat-card ${stat.tone ?? 'default'}`}
          >
            <span className="mission-stat-label">{stat.label}</span>
            <strong className="mission-stat-value">{stat.value}</strong>
            <p className="mission-stat-detail">{stat.detail}</p>
          </article>
        ))}
      </div>

      <div className="mission-grid">
        <section className="mission-panel mission-panel-wide">
          <div className="mission-panel-header">
            <div>
              <span className="mission-panel-kicker">Priority Queue</span>
              <h3>집중 대상</h3>
            </div>
            <button className="btn-secondary mission-panel-action" onClick={onCreateDDay}>
              새 D-Day
            </button>
          </div>
          <div className="mission-focus-list">
            {snapshot.focusItems.length > 0 ? (
              snapshot.focusItems.map(item => (
                <button
                  key={item.id}
                  className={`mission-focus-card ${item.isSelected ? 'selected' : ''}`}
                  onClick={() => onFocusDDay(item.id)}
                >
                  <div className="mission-focus-top">
                    <div>
                      <span className="mission-focus-phase">{item.phase}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <div className="mission-focus-meta">
                      <span className="mission-chip">{item.countdownLabel}</span>
                      <span className={`mission-chip tone-${item.urgencyLabel}`}>{item.urgencyLabel}</span>
                    </div>
                  </div>
                  <div className="mission-focus-progress">
                    <div className="mission-focus-bar">
                      <div
                        className="mission-focus-bar-fill"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <span>{item.progressLabel}</span>
                  </div>
                  <div className="mission-focus-bottom">
                    <span>{item.dateLabel}</span>
                    <span>{item.moodLabel}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="mission-panel-empty">
                활성 D-Day가 없어 우선순위 큐를 만들 수 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className="mission-panel">
          <div className="mission-panel-header">
            <div>
              <span className="mission-panel-kicker">Flight Path</span>
              <h3>{snapshot.highlightTitle ?? '선택된 일정 없음'}</h3>
            </div>
            <span className="mission-panel-note">{snapshot.highlightDateLabel}</span>
          </div>
          {snapshot.milestones.length > 0 ? (
            <div className="mission-milestones">
              {snapshot.milestones.map(step => (
                <div key={`${step.label}-${step.dateLabel}`} className={`mission-milestone ${step.status}`}>
                  <div className="mission-milestone-dot" />
                  <div className="mission-milestone-copy">
                    <strong>{step.label}</strong>
                    <span>{step.dateLabel}</span>
                  </div>
                  <span className="mission-milestone-relative">{step.relativeLabel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mission-panel-empty">
              상세 마일스톤을 보려면 활성 D-Day를 선택하세요.
            </div>
          )}
        </section>

        <ForecastLab
          key={highlightedDday?.id ?? 'forecast-empty'}
          dday={highlightedDday}
          archivedDdays={deferredArchived}
          emotionEntries={highlightedDday ? (emotionLog[highlightedDday.id] ?? []) : []}
        />

        <section className="mission-panel">
          <div className="mission-panel-header">
            <div>
              <span className="mission-panel-kicker">Emotion Weather</span>
              <h3>{snapshot.emotionAverageLabel}</h3>
            </div>
            <span className="mission-panel-note">{snapshot.emotionCoverageLabel}</span>
          </div>
          <p className="mission-panel-subcopy">{snapshot.emotionStreakLabel}</p>
          <div className="mission-emotion-chart">
            {snapshot.emotionPoints.map(point => (
              <div key={point.date} className="mission-emotion-column">
                <div className="mission-emotion-track">
                  {point.averageLevel !== null ? (
                    <div
                      className="mission-emotion-fill"
                      style={{ height: `${(point.averageLevel / 5) * 100}%` }}
                    />
                  ) : (
                    <div className="mission-emotion-empty" />
                  )}
                </div>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mission-panel">
          <div className="mission-panel-header">
            <div>
              <span className="mission-panel-kicker">Archive Feed</span>
              <h3>{snapshot.archiveAverageLabel}</h3>
            </div>
            <span className="mission-panel-note">{snapshot.archiveCompletionLabel}</span>
          </div>
          {snapshot.archiveItems.length > 0 ? (
            <div className="mission-archive-list">
              {snapshot.archiveItems.map(item => (
                <article key={item.id} className="mission-archive-card">
                  <h4>{item.title}</h4>
                  <div className="mission-archive-meta">
                    <span>{item.completedLabel}</span>
                    <span>{item.durationLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mission-panel-empty">
              아직 완료된 일정이 없어 아카이브 피드가 비어 있습니다.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
