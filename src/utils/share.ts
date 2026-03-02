import type { DDay } from '../types';

export function encodeShareUrl(dday: DDay): string {
  const data = {
    t: dday.title,
    d: dday.targetDate,
    s: dday.startDate,
    sl: dday.sleepHours,
  };
  const encoded = btoa(JSON.stringify(data));
  return `${window.location.origin}${window.location.pathname}?share=${encoded}`;
}

export function decodeShareUrl(): Partial<DDay> | null {
  const params = new URLSearchParams(window.location.search);
  const share = params.get('share');
  if (!share) return null;

  try {
    const data = JSON.parse(atob(share));
    return {
      title: data.t,
      targetDate: data.d,
      startDate: data.s,
      sleepHours: data.sl,
    };
  } catch {
    return null;
  }
}
