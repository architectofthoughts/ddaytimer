import type { ArchivedDDay, DDay, EmotionEntry } from '../types';

const DAY_MS = 1000 * 60 * 60 * 24;

export interface ForecastBase {
  remainingDays: number;
  remainingDaysExact: number;
  awakeHoursPerDay: number;
  progressPercent: number;
  recentMoodAverage: number | null;
  moodTrend: number;
  logCoverage: number;
  recommendedShare: number;
  recommendedHoursPerDay: number;
  moodSignalLabel: string;
  benchmarkLabel: string;
}

export interface ForecastScenario {
  focusShare: number;
  recoveryDays: number;
  focusHoursPerDay: number;
  focusBudgetHours: number;
  productiveDays: number;
  coverageRatio: number;
  confidence: number;
  burnoutRisk: number;
  status: 'risk' | 'balanced' | 'push' | 'overdrive';
  statusLabel: string;
  statusCopy: string;
  guidance: string;
  burnoutLabel: string;
  focusMixLabel: string;
  runwayLabel: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatHours(value: number): string {
  if (value >= 10) return `${value.toFixed(0)}h`;
  return `${value.toFixed(1)}h`;
}

function getMoodTrend(entries: EmotionEntry[]): number {
  if (entries.length < 2) return 0;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sorted.length < 4) {
    return clamp(sorted.at(-1)!.level - sorted[0].level, -2, 2);
  }

  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = average(sorted.slice(0, midpoint).map(entry => entry.level)) ?? 0;
  const secondHalf = average(sorted.slice(midpoint).map(entry => entry.level)) ?? 0;
  return clamp(secondHalf - firstHalf, -2, 2);
}

function getMoodSignalLabel(recentMoodAverage: number | null, moodTrend: number): string {
  if (recentMoodAverage === null) return '감정 로그가 적어 중립 시나리오로 계산 중';
  if (recentMoodAverage >= 4.2 && moodTrend >= 0) return '감정 페이스가 안정적이라 공격적인 운영도 가능합니다';
  if (recentMoodAverage >= 3.5 && moodTrend >= -0.2) return '현재 감정 페이스는 비교적 안정적입니다';
  if (moodTrend <= -0.6) return '최근 감정 흐름이 하락 중이라 회복일이 더 중요합니다';
  if (recentMoodAverage <= 2.6) return '에너지 저점 구간이라 무리한 스프린트는 비추천입니다';
  return '감정 페이스가 흔들려 버퍼 확보가 유리합니다';
}

export function buildForecastBase(
  dday: DDay,
  emotionEntries: EmotionEntry[],
  archivedDdays: ArchivedDDay[],
  now = Date.now()
): ForecastBase {
  const start = new Date(dday.startDate).getTime();
  const target = new Date(dday.targetDate).getTime();
  const totalWindow = Math.max(target - start, DAY_MS / 2);
  const remainingMs = Math.max(target - now, 0);
  const remainingDaysExact = Math.max(remainingMs / DAY_MS, 0.25);
  const remainingDays = Math.max(1, Math.ceil(remainingDaysExact));
  const awakeHoursPerDay = Math.max(4, 24 - dday.sleepHours);
  const progressPercent = clamp(((now - start) / totalWindow) * 100, 0, 100);

  const recentEntries = emotionEntries.filter(
    entry => now - new Date(entry.timestamp).getTime() <= DAY_MS * 7
  );
  const recentMoodAverage = average(recentEntries.map(entry => entry.level));
  const moodTrend = getMoodTrend(recentEntries);
  const logCoverage = clamp(recentEntries.length / 5, 0, 1);

  const pressureFactor = clamp((14 - remainingDaysExact) / 14, 0, 1);
  const progressFactor = progressPercent / 100;
  const moodPenalty = recentMoodAverage === null
    ? 0.03
    : clamp((3.4 - recentMoodAverage) / 2.4, 0, 1) * 0.1;
  const trendPenalty = moodTrend < -0.3 ? 0.05 : moodTrend > 0.3 ? -0.02 : 0;

  const recommendedShare = clamp(
    0.14
      + pressureFactor * 0.18
      + progressFactor * 0.08
      + moodPenalty
      + trendPenalty,
    0.12,
    0.55
  );

  const averageArchiveDays = average(
    archivedDdays.map(item => item.totalDurationMs / DAY_MS)
  );
  const currentWindowDays = totalWindow / DAY_MS;
  let benchmarkLabel = '아카이브가 쌓이면 개인 기준선과 비교합니다';

  if (averageArchiveDays !== null) {
    const ratio = currentWindowDays / averageArchiveDays;
    if (ratio >= 1.2) {
      benchmarkLabel = `평균 완료 사이클보다 긴 일정 (${currentWindowDays.toFixed(0)}일)`;
    } else if (ratio <= 0.8) {
      benchmarkLabel = `평균 완료 사이클보다 짧은 압축 일정 (${currentWindowDays.toFixed(0)}일)`;
    } else {
      benchmarkLabel = `평균 완료 사이클과 비슷한 길이 (${currentWindowDays.toFixed(0)}일)`;
    }
  }

  return {
    remainingDays,
    remainingDaysExact,
    awakeHoursPerDay,
    progressPercent,
    recentMoodAverage,
    moodTrend,
    logCoverage,
    recommendedShare,
    recommendedHoursPerDay: awakeHoursPerDay * recommendedShare,
    moodSignalLabel: getMoodSignalLabel(recentMoodAverage, moodTrend),
    benchmarkLabel,
  };
}

export function evaluateForecastScenario(
  base: ForecastBase,
  focusShare: number,
  recoveryDays: number
): ForecastScenario {
  const productiveDays = Math.max(0.5, base.remainingDaysExact - recoveryDays * 0.85);
  const focusHoursPerDay = base.awakeHoursPerDay * focusShare;
  const moodMultiplier = clamp(
    1
      + (base.recentMoodAverage === null ? 0 : (base.recentMoodAverage - 3) * 0.08)
      + clamp(base.moodTrend, -0.8, 0.8) * 0.12
      + base.logCoverage * 0.04,
    0.78,
    1.18
  );
  const focusBudgetHours = productiveDays * focusHoursPerDay * moodMultiplier;
  const recommendedBudgetHours = Math.max(0.5, base.remainingDaysExact) * base.recommendedHoursPerDay;
  const coverageRatio = focusBudgetHours / recommendedBudgetHours;

  const confidence = Math.round(clamp(
    coverageRatio * 68
      + (base.recentMoodAverage ?? 3) * 6
      + Math.max(base.moodTrend, -0.5) * 12
      - recoveryDays * 2,
    15,
    98
  ));

  const burnoutRisk = Math.round(clamp(
    ((focusShare - 0.24) / 0.26) * 55
      + ((3.2 - (base.recentMoodAverage ?? 3.2)) / 2.2) * 20
      + (recoveryDays === 0 ? 12 : 0)
      - Math.max(base.moodTrend, 0) * 15,
    5,
    95
  ));

  let status: ForecastScenario['status'] = 'balanced';
  let statusLabel = '온트랙';
  let statusCopy = '현재 설정이면 권장 페이스와 거의 비슷한 수준입니다.';
  let guidance = '지금의 배분을 유지하되 감정 로그가 하락하면 회복일을 하루 더 확보하세요.';

  if (coverageRatio < 0.88) {
    status = 'risk';
    statusLabel = '불안정';
    statusCopy = '권장 페이스보다 집중 투입 시간이 부족합니다.';
    guidance = '집중 비율을 올리거나 회복일을 줄여 필요한 실행 시간을 확보하세요.';
  } else if (burnoutRisk >= 70 && coverageRatio > 1.02) {
    status = 'overdrive';
    statusLabel = '과열';
    statusCopy = '마감은 커버되지만 현재 감정 상태 기준으로는 과부하 위험이 큽니다.';
    guidance = '집중 비율을 약간 낮추거나 회복일을 최소 1일 확보해 피로 누적을 줄이세요.';
  } else if (coverageRatio > 1.18) {
    status = 'push';
    statusLabel = '공격적';
    statusCopy = '권장 페이스보다 강한 배분이라 버퍼를 만들 여지가 있습니다.';
    guidance = '초반 2~3일만 강하게 운영하고, 이후에는 안정 페이스로 다시 낮추는 편이 좋습니다.';
  }

  let burnoutLabel = '낮음';
  if (burnoutRisk >= 70) burnoutLabel = '높음';
  else if (burnoutRisk >= 40) burnoutLabel = '중간';

  return {
    focusShare,
    recoveryDays,
    focusHoursPerDay,
    focusBudgetHours,
    productiveDays,
    coverageRatio,
    confidence,
    burnoutRisk,
    status,
    statusLabel,
    statusCopy,
    guidance,
    burnoutLabel,
    focusMixLabel: `${Math.round(focusShare * 100)}% 집중 배분`,
    runwayLabel: `${productiveDays.toFixed(1)}일 x ${formatHours(focusHoursPerDay)}/day`,
  };
}
