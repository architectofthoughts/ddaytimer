import type { FunUnit } from '../types';

export function getFunUnits(totalMs: number): FunUnit[] {
  const totalMinutes = totalMs / 1000 / 60;
  const totalHours = totalMinutes / 60;

  return [
    {
      label: 'Coffee cups',
      emoji: '\u2615',
      value: Math.floor(totalMinutes / 30),
      unit: 'cups',
    },
    {
      label: 'Netflix episodes',
      emoji: '\uD83C\uDFAC',
      value: Math.floor(totalMinutes / 45),
      unit: 'episodes',
    },
    {
      label: 'Heartbeats',
      emoji: '\uD83D\uDC93',
      value: Math.floor((totalMs / 1000) * 1.17),
      unit: 'beats',
    },
    {
      label: 'Songs',
      emoji: '\uD83C\uDFB5',
      value: Math.floor(totalMinutes / 3.5),
      unit: 'songs',
    },
    {
      label: 'Cat naps',
      emoji: '\uD83D\uDE34',
      value: Math.floor(totalMinutes / 20),
      unit: 'naps',
    },
    {
      label: 'Ramen bowls',
      emoji: '\uD83C\uDF5C',
      value: Math.floor(totalMinutes / 15),
      unit: 'bowls',
    },
    {
      label: 'TikToks',
      emoji: '\uD83D\uDCF1',
      value: Math.floor(totalMinutes / 0.5),
      unit: 'videos',
    },
    {
      label: 'Breaths',
      emoji: '\uD83D\uDCA8',
      value: Math.floor(totalMinutes * 15),
      unit: 'breaths',
    },
    {
      label: 'Blinks',
      emoji: '\uD83D\uDC41\uFE0F',
      value: Math.floor((totalMs / 1000) * 0.28),
      unit: 'blinks',
    },
    {
      label: 'Walking distance',
      emoji: '\uD83D\uDEB6',
      value: Math.round(totalHours * 5),
      unit: 'km',
    },
  ];
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}
