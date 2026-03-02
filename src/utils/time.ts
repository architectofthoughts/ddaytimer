import type { TimeRemaining } from '../types';

export function getTimeRemaining(targetDate: string): TimeRemaining {
  const total = new Date(targetDate).getTime() - Date.now();

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds, isComplete: false };
}

export function getAwakeTimeRemaining(
  targetDate: string,
  sleepHours: number
): TimeRemaining {
  const total = new Date(targetDate).getTime() - Date.now();

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const awakeRatio = (24 - sleepHours) / 24;
  const awakeTotal = total * awakeRatio;

  const seconds = Math.floor((awakeTotal / 1000) % 60);
  const minutes = Math.floor((awakeTotal / 1000 / 60) % 60);
  const hours = Math.floor((awakeTotal / (1000 * 60 * 60)) % 24);
  const days = Math.floor(awakeTotal / (1000 * 60 * 60 * 24));

  return { total: awakeTotal, days, hours, minutes, seconds, isComplete: false };
}

export function getProgress(startDate: string, targetDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(targetDate).getTime();
  const now = Date.now();

  if (now >= end) return 100;
  if (now <= start) return 0;

  return ((now - start) / (end - start)) * 100;
}

export function formatDuration(ms: number): string {
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;

  if (years > 0) {
    const remainDays = totalDays - years * 365;
    return remainDays > 0 ? `${years}년 ${remainDays}일` : `${years}년`;
  }
  if (months > 0) {
    return days > 0 ? `${months}개월 ${days}일` : `${months}개월`;
  }
  return `${totalDays}일`;
}

export function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}
