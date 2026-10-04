import { useState, useRef, useCallback, useEffect } from 'react';
import { Color, TimeControl, TIME_CONTROLS } from '../types/chess';
import { soundService } from '../utils/soundService';

export interface UseChessClockProps {
  initialTimeControl?: TimeControl;
  onTimeout?: (timedOutColor: Color) => void;
}

export function formatClockTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${mm}:${ss}`;
}

export function useChessClock({
  initialTimeControl = TIME_CONTROLS[5], // Default: 5 + 3 (Blitz)
  onTimeout,
}: UseChessClockProps = {}) {
  const [timeControl, setTimeControl] = useState<TimeControl>(initialTimeControl);
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(initialTimeControl.minutes * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(initialTimeControl.minutes * 60 * 1000);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // High-precision timing refs to prevent drift and avoid duplicate timers
  const intervalRef = useRef<number | null>(null);
  const turnStartTimeRef = useRef<number>(0);
  const whiteRemainingRef = useRef<number>(initialTimeControl.minutes * 60 * 1000);
  const blackRemainingRef = useRef<number>(initialTimeControl.minutes * 60 * 1000);
  const activeColorRef = useRef<Color | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const onTimeoutRef = useRef(onTimeout);
  const lastLowTimeAudioRef = useRef<number | null>(null);
  const timeControlRef = useRef<TimeControl>(initialTimeControl);

  onTimeoutRef.current = onTimeout;
  timeControlRef.current = timeControl;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Update clock countdown on each tick
  const tick = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current || !activeColorRef.current) {
      return;
    }

    const now = Date.now();
    const elapsed = now - turnStartTimeRef.current;
    const isWhite = activeColorRef.current === 'w';
    const baseRemaining = isWhite ? whiteRemainingRef.current : blackRemainingRef.current;
    const remaining = Math.max(0, baseRemaining - elapsed);

    if (isWhite) {
      setWhiteTimeMs(remaining);
    } else {
      setBlackTimeMs(remaining);
    }

    // Play subtle audio tick when entering critical seconds (e.g. <= 10s)
    const remainingSec = Math.ceil(remaining / 1000);
    if (remainingSec <= 10 && remainingSec > 0 && remainingSec !== lastLowTimeAudioRef.current) {
      lastLowTimeAudioRef.current = remainingSec;
      soundService.play('lowTime');
    }

    // Timeout (Flag) reached
    if (remaining <= 0) {
      clearTimer();
      setIsRunning(false);
      isRunningRef.current = false;
      const timedOutPlayer = activeColorRef.current;
      setActiveColor(null);
      activeColorRef.current = null;
      if (onTimeoutRef.current && timedOutPlayer) {
        onTimeoutRef.current(timedOutPlayer);
      }
    }
  }, [clearTimer]);

  const startTicking = useCallback(
    (color: Color) => {
      clearTimer();
      turnStartTimeRef.current = Date.now();
      activeColorRef.current = color;
      isRunningRef.current = true;
      isPausedRef.current = false;

      setActiveColor(color);
      setIsRunning(true);
      setIsPaused(false);

      // 100ms update interval ensures crisp visual updates without render thrashing
      intervalRef.current = window.setInterval(tick, 100);
    },
    [clearTimer, tick]
  );

  // Start the clock for White when the first move is made or game starts
  const startGameClock = useCallback(() => {
    if (isRunningRef.current) return;
    startTicking('w');
  }, [startTicking]);

  // Switch clock after a validated legal chess move
  const switchTurn = useCallback(
    (completedTurnColor: Color) => {
      if (isPausedRef.current) return;

      const incrementMs = timeControlRef.current.incrementSeconds * 1000;
      const now = Date.now();
      const elapsed = turnStartTimeRef.current > 0 ? now - turnStartTimeRef.current : 0;

      if (completedTurnColor === 'w') {
        const finalWhiteTime = Math.max(0, whiteRemainingRef.current - elapsed) + incrementMs;
        whiteRemainingRef.current = finalWhiteTime;
        setWhiteTimeMs(finalWhiteTime);
        // Switch to Black
        startTicking('b');
      } else {
        const finalBlackTime = Math.max(0, blackRemainingRef.current - elapsed) + incrementMs;
        blackRemainingRef.current = finalBlackTime;
        setBlackTimeMs(finalBlackTime);
        // Switch to White
        startTicking('w');
      }
    },
    [startTicking]
  );

  // Pause local clock
  const pause = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current || !activeColorRef.current) return;

    const now = Date.now();
    const elapsed = now - turnStartTimeRef.current;

    if (activeColorRef.current === 'w') {
      const rem = Math.max(0, whiteRemainingRef.current - elapsed);
      whiteRemainingRef.current = rem;
      setWhiteTimeMs(rem);
    } else {
      const rem = Math.max(0, blackRemainingRef.current - elapsed);
      blackRemainingRef.current = rem;
      setBlackTimeMs(rem);
    }

    clearTimer();
    setIsPaused(true);
    isPausedRef.current = true;
  }, [clearTimer]);

  // Resume local clock
  const resume = useCallback(() => {
    if (!isRunningRef.current || !isPausedRef.current || !activeColorRef.current) return;
    startTicking(activeColorRef.current);
  }, [startTicking]);

  // Stop clock (on checkmate, draw, resign, timeout)
  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setActiveColor(null);
    isRunningRef.current = false;
    isPausedRef.current = false;
    activeColorRef.current = null;
  }, [clearTimer]);

  // Reset clocks to starting time or with new time control
  const reset = useCallback(
    (newControl?: TimeControl) => {
      clearTimer();
      const tc = newControl || timeControlRef.current;
      if (newControl) {
        setTimeControl(newControl);
        timeControlRef.current = newControl;
      }

      const initialMs = tc.minutes * 60 * 1000;
      whiteRemainingRef.current = initialMs;
      blackRemainingRef.current = initialMs;
      setWhiteTimeMs(initialMs);
      setBlackTimeMs(initialMs);
      setActiveColor(null);
      setIsRunning(false);
      setIsPaused(false);
      lastLowTimeAudioRef.current = null;

      turnStartTimeRef.current = 0;
      activeColorRef.current = null;
      isRunningRef.current = false;
      isPausedRef.current = false;
    },
    [clearTimer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeControl,
    whiteTimeMs,
    blackTimeMs,
    activeColor,
    isRunning,
    isPaused,
    startGameClock,
    switchTurn,
    pause,
    resume,
    stop,
    reset,
    setTimeControl,
  };
}
