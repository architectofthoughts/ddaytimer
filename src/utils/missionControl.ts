import type { ArchivedDDay, DDay, EmotionEntry, EmotionLog } from '../types';
import { formatDuration } from './time';

const DAY_MS = 1000 * 60 * 60 * 24;
const HOUR_MS = 1000 * 60 * 60;

export interface MissionStat {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'danger';
}

export interface MissionFocusItem {
  id: string;
  title: string;
  countdownLabel: string;
  dateLabel: string;
  phase: string;
  urgencyLabel: string;
  urgencyScore: number;
  progressPercent: number;
  progressLabel: string;
  moodLabel: string;
  isSelected: boolean;
}

export interface MissionMilestone {
  label: string;
  dateLabel: string;
  relativeLabel: string;
  status: 'done' | 'upcoming';
}

export interface MissionEmotionPoint {
  date: string;
  label: string;
  averageLevel: number | null;
  count: number;
}

export interface MissionArchiveItem {
  id: string;
  title: string;
  completedLabel: string;
  durationLabel: string;
}

export interface MissionControlSnapshot {
  isEmpty: boolean;
  heroLabel: string;
  stats: MissionStat[];
  focusItems: MissionFocusItem[];
  highlightTitle: string | null;
  highlightDateLabel: string;
  milestones: MissionMilestone[];
  emotionAverageLabel: string;
  emotionCoverageLabel: string;
  emotionStreakLabel: string;
  emotionPoints: MissionEmotionPoint[];
  archiveAverageLabel: string;
  archiveCompletionLabel: string;
  archiveItems: MissionArchiveItem[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: string | number): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatCountdownLabel(remainingMs: number): string {
  if (remainingMs <= 0) {
    return '아카이브 대기';
  }

  if (remainingMs >= DAY_MS) {
    return `D-${Math.ceil(remainingMs / DAY_MS)}`;
  }

  if (remainingMs >= HOUR_MS) {
    return `${Math.ceil(remainingMs / HOUR_MS)}시간 남음`;
  }

  const minutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
  return `${minutes}분 남음`;
}

function formatRelativeLabel(deltaMs: number): string {
  if (Math.abs(deltaMs) < HOUR_MS) {
    return deltaMs <= 0 ? '방금 통과' : '곧 도달';
  }

  const absDays = Math.abs(deltaMs) / DAY_MS;
  if (absDays >= 1) {
    const days = Math.ceil(absDays);
    return deltaMs <= 0 ? `${days}일 전` : `${days}일 후`;
  }

  const hours = Math.ceil(Math.abs(deltaMs) / HOUR_MS);
  return deltaMs <= 0 ? `${hours}시간 전` : `${hours}시간 후`;
}

function getPhaseLabel(remainingMs: number, progress: number): string {
  if (remainingMs <= 0) return '정리 필요';
  if (remainingMs <= DAY_MS) return '즉시 대응';
  if (remainingMs <= DAY_MS * 3) return '파이널';
  if (progress >= 0.75) return '클로징';
  if (progress >= 0.4) return '순항';
  return '워밍업';
}

function getUrgencyLabel(score: number): string {
  if (score >= 75) return '긴급';
  if (score >= 50) return '주의';
  return '안정';
}

function getMoodLabel(entries: EmotionEntry[]): string {
  const recent = entries
    .filter(entry => Date.now() - new Date(entry.timestamp).getTime() <= DAY_MS * 5)
    .map(entry => entry.level);
  const avgMood = average(recent);
  return avgMood ? `감정 ${avgMood.toFixed(1)}/5` : '감정 로그 대기';
}

function buildFocusItems(ddays: DDay[], emotionLog: EmotionLog, selectedId: string | null, now: number): MissionFocusItem[] {
  return [...ddays]
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .map(dday => {
      const start = new Date(dday.startDate).getTime();
      const target = new Date(dday.targetDate).getTime();
      const totalWindow = Math.max(target - start, HOUR_MS);
      const remainingMs = target - now;
      const progress = clamp(((now - start) / totalWindow) * 100, 0, 100);
      const moodEntries = emotionLog[dday.id] ?? [];
      const recentMood = average(
        moodEntries
          .filter(entry => now - new Date(entry.timestamp).getTime() <= DAY_MS * 5)
          .map(entry => entry.level)
      );
      const moodPenalty = recentMood ? (5 - recentMood) * 8 : 10;
      const timePressure = remainingMs <= 0
        ? 40
        : clamp((DAY_MS * 7 - remainingMs) / DAY_MS, 0, 7) * 7;
      const completionPressure = progress * 0.35;
      const urgencyScore = Math.round(clamp(timePressure + completionPressure + moodPenalty + 20, 0, 99));

      return {
        id: dday.id,
        title: dday.title,
        countdownLabel: formatCountdownLabel(remainingMs),
        dateLabel: formatShortDate(dday.targetDate),
        phase: getPhaseLabel(remainingMs, progress / 100),
        urgencyLabel: getUrgencyLabel(urgencyScore),
        urgencyScore,
        progressPercent: Math.round(progress),
        progressLabel: `${Math.round(progress)}% 진행`,
        moodLabel: getMoodLabel(moodEntries),
        isSelected: dday.id === selectedId,
      };
    })
    .sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore;
      return a.dateLabel.localeCompare(b.dateLabel, 'ko');
    })
    .slice(0, 5);
}

function buildMilestones(dday: DDay | undefined, now: number): MissionMilestone[] {
  if (!dday) return [];

  const start = new Date(dday.startDate).getTime();
  const target = new Date(dday.targetDate).getTime();
  const total = Math.max(target - start, HOUR_MS);

  const milestoneCandidates = [
    { label: '시작', time: start },
    { label: '25% 고정', time: start + total * 0.25 },
    { label: '50% 순항', time: start + total * 0.5 },
    { label: '75% 집중', time: start + total * 0.75 },
    { label: '72h 스프린트', time: target - HOUR_MS * 72 },
    { label: '24h 파이널', time: target - HOUR_MS * 24 },
    { label: '도착', time: target },
  ]
    .filter(item => item.time >= start && item.time <= target)
    .sort((a, b) => a.time - b.time);

  const uniqueMilestones = milestoneCandidates.filter((item, index, items) =>
    index === 0 || Math.abs(item.time - items[index - 1].time) >= HOUR_MS
  );

  return uniqueMilestones.map(item => ({
    label: item.label,
    dateLabel: formatShortDate(item.time),
    relativeLabel: formatRelativeLabel(item.time - now),
    status: item.time <= now ? 'done' : 'upcoming',
  }));
}

function buildEmotionPoints(emotionLog: EmotionLog, now: number): MissionEmotionPoint[] {
  return Array.from({ length: 10 }, (_, offset) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (9 - offset));
    const key = toDateKey(date);

    const levels = Object.values(emotionLog)
      .flat()
      .filter(entry => entry.date === key)
      .map(entry => entry.level);

    return {
      date: key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
      }),
      averageLevel: average(levels),
      count: levels.length,
    };
  });
}

function getEmotionStreak(points: MissionEmotionPoint[]): number {
  let streak = 0;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].count === 0) break;
    streak += 1;
  }
  return streak;
}

export function buildMissionControlSnapshot(
  ddays: DDay[],
  archivedDdays: ArchivedDDay[],
  emotionLog: EmotionLog,
  selectedId: string | null
): MissionControlSnapshot {
  const now = Date.now();
  const focusItems = buildFocusItems(ddays, emotionLog, selectedId, now);
  const highlightedDday = ddays.find(item => item.id === selectedId) ?? ddays[0];
  const milestones = buildMilestones(highlightedDday, now);
  const emotionPoints = buildEmotionPoints(emotionLog, now);
  const emotionLevels = emotionPoints.flatMap(point => point.averageLevel ?? []);
  const emotionCoverage = emotionPoints.filter(point => point.count > 0).length;
  const emotionStreak = getEmotionStreak(emotionPoints);
  const dueSoonCount = ddays.filter(item => {
    const remainingMs = new Date(item.targetDate).getTime() - now;
    return remainingMs > 0 && remainingMs <= DAY_MS * 7;
  }).length;
  const readyToArchiveCount = ddays.filter(item => new Date(item.targetDate).getTime() <= now).length;
  const averageCycleMs = average(archivedDdays.map(item => item.totalDurationMs));
  const activeProgress = average(
    ddays.map(item => {
      const start = new Date(item.startDate).getTime();
      const target = new Date(item.targetDate).getTime();
      return clamp(((now - start) / Math.max(target - start, HOUR_MS)) * 100, 0, 100);
    })
  );
  const archiveItems = [...archivedDdays]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3)
    .map(item => ({
      id: item.id,
      title: item.title,
      completedLabel: formatShortDate(item.completedAt),
      durationLabel: formatDuration(item.totalDurationMs),
    }));

  const stats: MissionStat[] = [
    {
      label: '가동 중',
      value: `${ddays.length}`,
      detail: focusItems[0]
        ? `최우선 일정: ${focusItems[0].countdownLabel}`
        : '활성 D-Day가 없습니다',
      tone: 'accent',
    },
    {
      label: '7일 레이더',
      value: `${dueSoonCount}`,
      detail: dueSoonCount > 0 ? '마감 임박 일정 감지' : '즉시 대응 일정 없음',
    },
    {
      label: '아카이브 대기',
      value: `${readyToArchiveCount}`,
      detail: readyToArchiveCount > 0 ? '완료된 카운트다운이 남아 있습니다' : '모두 진행 중입니다',
      tone: readyToArchiveCount > 0 ? 'danger' : 'default',
    },
    {
      label: '활성 페이스',
      value: activeProgress !== null ? `${Math.round(activeProgress)}%` : '대기',
      detail: activeProgress !== null ? '현재 진행률 평균' : '진행률 계산 데이터 없음',
    },
  ];

  return {
    isEmpty: ddays.length === 0 && archivedDdays.length === 0,
    heroLabel: focusItems[0] ? `${focusItems[0].phase} / ${focusItems[0].countdownLabel}` : '실험 뷰 준비 완료',
    stats,
    focusItems,
    highlightTitle: highlightedDday?.title ?? null,
    highlightDateLabel: highlightedDday ? formatShortDate(highlightedDday.targetDate) : '선택된 일정 없음',
    milestones,
    emotionAverageLabel: emotionLevels.length > 0
      ? `${average(emotionLevels)?.toFixed(1)}/5`
      : '로그 없음',
    emotionCoverageLabel: `${emotionCoverage}/10일 기록`,
    emotionStreakLabel: emotionStreak > 0 ? `${emotionStreak}일 연속 입력` : '입력 스트릭 없음',
    emotionPoints,
    archiveAverageLabel: averageCycleMs !== null ? formatDuration(averageCycleMs) : '데이터 대기',
    archiveCompletionLabel: `${archivedDdays.length}건 완료`,
    archiveItems,
  };
}
