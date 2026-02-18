import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentTaskName, setCurrentTaskName] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback((taskId: string, taskName: string) => {
    setCurrentTaskId(taskId);
    setCurrentTaskName(taskName);
    setElapsed(0);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  const stop = useCallback(() => {
    setIsRunning(false);
    const duration = elapsed;
    return duration;
  }, [elapsed]);

  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
    setCurrentTaskId(null);
    setCurrentTaskName(null);
  }, []);

  const formatTime = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    if (m > 0) return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    elapsed, isRunning, currentTaskId, currentTaskName,
    start, pause, resume, stop, reset, formatTime,
  };
}
