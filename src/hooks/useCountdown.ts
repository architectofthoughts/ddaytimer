import { useState, useEffect, useEffectEvent, useRef } from 'react';
import type { TimeRemaining } from '../types';
import { getTimeRemaining, getAwakeTimeRemaining } from '../utils/time';

export function useCountdown(targetDate: string, sleepHours: number) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    getTimeRemaining(targetDate)
  );
  const [awakeTimeRemaining, setAwakeTimeRemaining] = useState<TimeRemaining>(() =>
    getAwakeTimeRemaining(targetDate, sleepHours)
  );
  const wasComplete = useRef(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const resetCompletion = useEffectEvent(() => {
    wasComplete.current = false;
    setJustCompleted(false);
  });

  useEffect(() => {
    resetCompletion();
  }, [targetDate]);

  useEffect(() => {
    const update = () => {
      const remaining = getTimeRemaining(targetDate);
      const awakeRemaining = getAwakeTimeRemaining(targetDate, sleepHours);
      setTimeRemaining(remaining);
      setAwakeTimeRemaining(awakeRemaining);

      if (remaining.isComplete && !wasComplete.current) {
        wasComplete.current = true;
        setJustCompleted(true);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, sleepHours]);

  return { timeRemaining, awakeTimeRemaining, justCompleted, setJustCompleted };
}
