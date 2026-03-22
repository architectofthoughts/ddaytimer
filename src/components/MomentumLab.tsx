import type { JourneyInsight } from '../types';

interface MomentumLabProps {
  insight: JourneyInsight;
}

function formatCheckpointDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function checkpointLabel(insight: JourneyInsight) {
  if (!insight.nextCheckpoint) {
    return '모든 체크포인트 통과';
  }

  return `${insight.nextCheckpoint.label} · ${formatCheckpointDate(insight.nextCheckpoint.date)}`;
}

function moodChip(insight: JourneyInsight) {
  if (insight.moodTrend === 'rising') return '상승';
  if (insight.moodTrend === 'falling') return '하락';
  if (insight.moodTrend === 'steady') return '안정';
  return '수집 중';
}

export default function MomentumLab({ insight }: MomentumLabProps) {
  return (
    <section className="momentum-lab">
      <div className="momentum-lab-header">
        <div>
          <div className="momentum-lab-eyebrow">Experimental</div>
          <h3>Momentum Lab</h3>
        </div>
        <div className="momentum-lab-badge">{insight.phaseLabel}</div>
      </div>

      <p className="momentum-lab-summary">{insight.phaseDetail}</p>

      <div className="momentum-ratio-bar" aria-hidden="true">
        <div className="momentum-ratio-fill" style={{ width: `${insight.progressPercent}%` }} />
      </div>
      <div className="momentum-ratio-caption">
        <span>{insight.daysElapsed}일 경과</span>
        <strong>{insight.progressPercent}% 진행</strong>
        <span>{insight.daysRemaining}일 남음</span>
      </div>

      <div className="momentum-metrics">
        <article className="momentum-metric-card">
          <span className="momentum-metric-label">남은 집중 블록</span>
          <strong className="momentum-metric-value">{insight.focusBlocksLeft}</strong>
          <p>{insight.focusHoursLeft}시간 기준으로 계산된 90분 세션 수</p>
        </article>

        <article className="momentum-metric-card">
          <span className="momentum-metric-label">감정 기류</span>
          <strong className="momentum-metric-value">
            {insight.moodAverage === null ? moodChip(insight) : `${insight.moodAverage.toFixed(1)} / 5`}
          </strong>
          <p>{insight.moodSummary}</p>
        </article>

        <article className="momentum-metric-card">
          <span className="momentum-metric-label">다음 체크포인트</span>
          <strong className="momentum-metric-value">{checkpointLabel(insight)}</strong>
          <p>{insight.cadenceLabel}: {insight.cadenceDetail}</p>
        </article>
      </div>

      <div className="momentum-checkpoints">
        {insight.checkpoints.map((checkpoint) => (
          <div
            key={checkpoint.label}
            className={`momentum-checkpoint ${checkpoint.state}`}
          >
            <div className="momentum-checkpoint-dot" />
            <div className="momentum-checkpoint-copy">
              <strong>{checkpoint.label}</strong>
              <span>{formatCheckpointDate(checkpoint.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
