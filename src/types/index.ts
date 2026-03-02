export interface DDay {
  id: string;
  title: string;
  targetDate: string; // ISO string
  startDate: string; // ISO string
  sleepHours: number;
  createdAt: string;
  capsuleMessage?: string;
}

export interface TimeRemaining {
  total: number; // ms
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

export interface FunUnit {
  label: string;
  emoji: string;
  value: number;
  unit: string;
}

export type Theme = 'dark' | 'light';

// Emotion thermometer
export type EmotionLevel = 1 | 2 | 3 | 4 | 5;

export interface EmotionEntry {
  date: string; // YYYY-MM-DD
  level: EmotionLevel;
  timestamp: string;
}

export type EmotionLog = Record<string, EmotionEntry[]>; // key = dday.id

// Holiday suggestions
export interface HolidaySuggestion {
  id: string;
  name: string;
  date: string;
  category: 'holiday' | 'exam' | 'anniversary';
  icon: string;
}

export interface AnniversaryTemplate {
  id: string;
  label: string;
  daysFromBase: number;
  icon: string;
}

// History / Archive
export interface ArchivedDDay extends DDay {
  archivedAt: string;
  completedAt: string;
  totalDurationMs: number;
}
