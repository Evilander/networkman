import { useState, useEffect } from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

const TIME_TINTS: Record<TimeOfDay, string> = {
  dawn: 'rgba(255, 180, 100, 0.08)',
  day: 'rgba(255, 255, 200, 0.03)',
  dusk: 'rgba(255, 120, 50, 0.10)',
  night: 'rgba(30, 30, 100, 0.15)',
};

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 20) return 'dusk';
  return 'night';
}

export function useDayNight() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    getTimeOfDay(new Date().getHours())
  );

  useEffect(() => {
    const check = () => setTimeOfDay(getTimeOfDay(new Date().getHours()));
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, []);

  return {
    timeOfDay,
    tint: TIME_TINTS[timeOfDay],
  };
}
