import { useLocalStorage } from './useLocalStorage';
import type { EmotionLevel, EmotionEntry, EmotionLog } from '../types';

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
}

export function useEmotionLog(ddayId: string) {
  const [log, setLog] = useLocalStorage<EmotionLog>('emotion-log', {});

  const entries = log[ddayId] || [];
  const today = todayKey();
  const todayEntry = entries.find(e => e.date === today);

  const logEmotion = (level: EmotionLevel) => {
    setLog(prev => {
      const existing = prev[ddayId] || [];
      const todayIndex = existing.findIndex(e => e.date === today);
      const entry: EmotionEntry = {
        date: today,
        level,
        timestamp: new Date().toISOString(),
      };

      let updated: EmotionEntry[];
      if (todayIndex >= 0) {
        updated = [...existing];
        updated[todayIndex] = entry;
      } else {
        updated = [...existing, entry];
      }

      return { ...prev, [ddayId]: updated };
    });
  };

  const removeEntries = (id: string) => {
    setLog(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return { todayEntry, entries, logEmotion, removeEntries };
}
