import type { EmotionEntry, JourneyCheckpoint, JourneyInsight } from '../types';
import { getProgress } from '../utils/time';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toDayCount(ms: number) {
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function average(entries: EmotionEntry[]) {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => sum + entry.level, 0) / entries.length;
}

function buildPhase(progressPercent: number, daysRemaining: number, isComplete: boolean) {
  if (isComplete) {
    return {
      phaseLabel: 'Archive Orbit',
      phaseDetail: '카운트다운이 끝났습니다. 결과를 정리하고 다음 목표를 설계할 타이밍입니다.',
    };
  }

  if (progressPercent < 15) {
    return {
      phaseLabel: 'Ignition',
      phaseDetail: '초기 구간입니다. 목표를 잘게 쪼개고 초반 리듬을 만드는 편이 유리합니다.',
    };
  }

  if (progressPercent < 45) {
    return {
      phaseLabel: 'Build-up',
      phaseDetail: '루틴이 자리잡는 구간입니다. 매일 같은 시간에 반복할 작업을 고정하세요.',
    };
  }

  if (progressPercent < 75) {
    return {
      phaseLabel: 'Cruise',
      phaseDetail: '중반 구간입니다. 무리한 가속보다 유지 가능한 속도를 지키는 편이 좋습니다.',
    };
  }

  if (daysRemaining > 3) {
    return {
      phaseLabel: 'Final Approach',
      phaseDetail: '후반입니다. 남은 범위를 줄이고 꼭 필요한 작업만 남기는 편이 효율적입니다.',
    };
  }

  return {
    phaseLabel: 'Launch Window',
    phaseDetail: '마감 직전입니다. 새 시도보다 마무리와 검증에 집중하는 편이 안전합니다.',
  };
}

function buildMood(entries: EmotionEntry[]) {
  if (entries.length === 0) {
    return {
      moodAverage: null,
      moodTrend: 'insufficient' as const,
      moodSummary: '감정 로그가 쌓이면 최근 컨디션 흐름을 읽어드립니다.',
    };
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);
  const recentAverage = average(recent);
  const previousAverage = average(previous);

  let moodTrend: JourneyInsight['moodTrend'] = 'steady';
  if (recentAverage !== null && previousAverage !== null) {
    const delta = recentAverage - previousAverage;
    if (delta >= 0.4) moodTrend = 'rising';
    else if (delta <= -0.4) moodTrend = 'falling';
  } else if (recent.length < 3) {
    moodTrend = 'insufficient';
  }

  if (recentAverage === null) {
    return {
      moodAverage: null,
      moodTrend: 'insufficient' as const,
      moodSummary: '아직 최근 로그가 적어서 추세를 판단하기 어렵습니다.',
    };
  }

  const tone =
    recentAverage >= 4.2 ? '상당히 좋은 흐름' :
    recentAverage >= 3.4 ? '안정적인 흐름' :
    recentAverage >= 2.5 ? '기복이 있는 흐름' :
    '회복이 필요한 흐름';

  const trendText =
    moodTrend === 'rising' ? '최근 기분이 상승 중입니다.' :
    moodTrend === 'falling' ? '최근 기분이 내려가는 신호가 있습니다.' :
    moodTrend === 'steady' ? '최근 기분이 비교적 안정적입니다.' :
    '조금 더 기록되면 추세를 정확히 볼 수 있습니다.';

  return {
    moodAverage: Number(recentAverage.toFixed(1)),
    moodTrend,
    moodSummary: `${tone}. ${trendText}`,
  };
}

function buildCadence(daysRemaining: number, focusBlocksLeft: number, isComplete: boolean) {
  if (isComplete) {
    return {
      cadenceLabel: '회고 모드',
      cadenceDetail: '성과를 정리하고 다음 D-Day를 위한 템플릿을 남겨두기 좋습니다.',
    };
  }

  if (daysRemaining <= 3 || focusBlocksLeft <= 10) {
    return {
      cadenceLabel: '집중 스프린트',
      cadenceDetail: '하루 우선순위를 1~2개로 줄이고, 검증 가능한 작업부터 끝내는 편이 좋습니다.',
    };
  }

  if (daysRemaining <= 14) {
    return {
      cadenceLabel: '데일리 푸시',
      cadenceDetail: '짧은 세션을 매일 쌓는 전략이 적합합니다. 밀린 항목은 즉시 정리하세요.',
    };
  }

  return {
    cadenceLabel: '롱런 페이스',
    cadenceDetail: '주간 단위로 큰 작업을 나누고, 하루는 버퍼로 비워두는 편이 안정적입니다.',
  };
}

function buildCheckpoints(startMs: number, targetMs: number, progressPercent: number) {
  const marks = [
    { label: 'Quarter', progress: 25 },
    { label: 'Midpoint', progress: 50 },
    { label: '75%', progress: 75 },
    { label: '90%', progress: 90 },
    { label: 'Launch', progress: 100 },
  ];

  let activeAssigned = false;

  return marks.map<JourneyCheckpoint>((mark) => {
    const checkpointTime = startMs + ((targetMs - startMs) * mark.progress) / 100;
    let state: JourneyCheckpoint['state'] = 'upcoming';

    if (progressPercent >= mark.progress) {
      state = 'done';
    } else if (!activeAssigned) {
      state = 'active';
      activeAssigned = true;
    }

    return {
      label: mark.label,
      progress: mark.progress,
      date: new Date(checkpointTime).toISOString(),
      state,
    };
  });
}

export function useJourneyInsights(
  startDate: string,
  targetDate: string,
  awakeTimeRemainingMs: number,
  emotionEntries: EmotionEntry[],
  isComplete: boolean,
): JourneyInsight {
  const startMs = new Date(startDate).getTime();
  const targetMs = new Date(targetDate).getTime();
  const nowMs = Date.now();
  const progressPercent = clamp(getProgress(startDate, targetDate), 0, 100);
  const totalMs = Math.max(targetMs - startMs, 0);
  const elapsedMs = clamp(nowMs - startMs, 0, totalMs);
  const remainingMs = Math.max(targetMs - nowMs, 0);
  const focusBlocksLeft = Math.max(0, Math.floor(awakeTimeRemainingMs / (1000 * 60 * 90)));
  const focusHoursLeft = Math.max(0, Math.round((awakeTimeRemainingMs / (1000 * 60 * 60)) * 10) / 10);
  const daysRemaining = toDayCount(remainingMs);
  const daysElapsed = toDayCount(elapsedMs);
  const totalDays = Math.max(toDayCount(totalMs), 1);
  const completionRatio = clamp(progressPercent / 100, 0, 1);
  const remainingRatio = 1 - completionRatio;
  const phase = buildPhase(progressPercent, daysRemaining, isComplete);
  const mood = buildMood(emotionEntries);
  const cadence = buildCadence(daysRemaining, focusBlocksLeft, isComplete);
  const checkpoints = buildCheckpoints(startMs, targetMs, progressPercent);
  const nextCheckpoint = checkpoints.find((checkpoint) => checkpoint.state === 'active') || null;

  return {
    phaseLabel: phase.phaseLabel,
    phaseDetail: phase.phaseDetail,
    completionRatio,
    remainingRatio,
    progressPercent: Math.round(progressPercent),
    daysRemaining,
    daysElapsed,
    totalDays,
    focusBlocksLeft,
    focusHoursLeft,
    cadenceLabel: cadence.cadenceLabel,
    cadenceDetail: cadence.cadenceDetail,
    moodAverage: mood.moodAverage,
    moodTrend: mood.moodTrend,
    moodSummary: mood.moodSummary,
    nextCheckpoint,
    checkpoints,
  };
}
