import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChessClock, formatClockTime } from '../hooks/useChessClock';
import { TIME_CONTROLS, TimeControl } from '../types/chess';
import { soundService } from '../utils/soundService';

describe('ChessNova Phase 3 — Chess Clock & Time Controls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Clock Formatting Utility', () => {
    it('formats millisecond durations into mm:ss strings', () => {
      expect(formatClockTime(300000)).toBe('05:00');
      expect(formatClockTime(37000)).toBe('00:37');
      expect(formatClockTime(5000)).toBe('00:05');
      expect(formatClockTime(0)).toBe('00:00');
      expect(formatClockTime(-1000)).toBe('00:00');
    });
  });

  describe('Time Control Presets', () => {
    it('contains all required time controls across categories', () => {
      const ids = TIME_CONTROLS.map((tc) => tc.id);
      // Bullet
      expect(ids).toContain('1+0');
      expect(ids).toContain('2+1');
      // Blitz
      expect(ids).toContain('3+0');
      expect(ids).toContain('3+2');
      expect(ids).toContain('5+0');
      expect(ids).toContain('5+3');
      // Rapid
      expect(ids).toContain('10+0');
      expect(ids).toContain('10+5');
      expect(ids).toContain('15+10');
      // Classical
      expect(ids).toContain('30+0');
      expect(ids).toContain('30+20');
    });
  });

  describe('useChessClock Hook Mechanics', () => {
    it('initializes with selected time control and does not count down before start', () => {
      const blitz53 = TIME_CONTROLS.find((tc) => tc.id === '5+3')!;
      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: blitz53 })
      );

      expect(result.current.timeControl.name).toBe('5 + 3');
      expect(result.current.whiteTimeMs).toBe(300000);
      expect(result.current.blackTimeMs).toBe(300000);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.activeColor).toBeNull();

      // Advancing time should not decrease time before start
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.whiteTimeMs).toBe(300000);
    });

    it('starts White clock on startGameClock and counts down', () => {
      const blitz53 = TIME_CONTROLS.find((tc) => tc.id === '5+3')!;
      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: blitz53 })
      );

      act(() => {
        result.current.startGameClock();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.activeColor).toBe('w');

      // Advance by 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.whiteTimeMs).toBeLessThanOrEqual(298000);
      // Black clock should NOT have decreased
      expect(result.current.blackTimeMs).toBe(300000);
    });

    it('switches clock from White to Black and adds increment to White', () => {
      const blitz53 = TIME_CONTROLS.find((tc) => tc.id === '5+3')!; // +3s increment
      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: blitz53 })
      );

      act(() => {
        result.current.startGameClock();
      });

      // White thinks for 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // White completes move: 300,000 - 5,000 + 3,000 increment = 298,000 ms
      act(() => {
        result.current.switchTurn('w');
      });

      expect(result.current.activeColor).toBe('b');
      expect(result.current.whiteTimeMs).toBe(298000);

      // Advance 2 seconds for Black
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.blackTimeMs).toBeLessThanOrEqual(298000);
      // White clock should remain frozen during Black turn
      expect(result.current.whiteTimeMs).toBe(298000);
    });

    it('handles Pause and Resume correctly without losing time', () => {
      const blitz53 = TIME_CONTROLS.find((tc) => tc.id === '5+3')!;
      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: blitz53 })
      );

      act(() => {
        result.current.startGameClock();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      const timeBeforePause = result.current.whiteTimeMs;

      // Pause clock
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      // Advance while paused
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Time should remain exactly frozen
      expect(result.current.whiteTimeMs).toBe(timeBeforePause);

      // Resume clock
      act(() => {
        result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.whiteTimeMs).toBeLessThan(timeBeforePause);
    });

    it('triggers onTimeout callback when clock reaches zero', () => {
      const onTimeoutMock = vi.fn();
      const bullet10: TimeControl = {
        id: '1+0',
        name: '1 + 0',
        category: 'bullet',
        minutes: 1,
        incrementSeconds: 0,
      };

      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: bullet10, onTimeout: onTimeoutMock })
      );

      act(() => {
        result.current.startGameClock();
      });

      // Advance past 60 seconds
      act(() => {
        vi.advanceTimersByTime(60500);
      });

      expect(onTimeoutMock).toHaveBeenCalledWith('w');
      expect(result.current.isRunning).toBe(false);
    });

    it('resets clock back to full time on reset()', () => {
      const blitz53 = TIME_CONTROLS.find((tc) => tc.id === '5+3')!;
      const { result } = renderHook(() =>
        useChessClock({ initialTimeControl: blitz53 })
      );

      act(() => {
        result.current.startGameClock();
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.whiteTimeMs).toBeLessThan(300000);

      act(() => {
        result.current.reset();
      });

      expect(result.current.whiteTimeMs).toBe(300000);
      expect(result.current.blackTimeMs).toBe(300000);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.activeColor).toBeNull();
    });
  });

  describe('Sound Service & Persistence', () => {
    it('allows toggling sound on and off', () => {
      soundService.setEnabled(true);
      expect(soundService.getEnabled()).toBe(true);

      const next = soundService.toggle();
      expect(next).toBe(false);
      expect(soundService.getEnabled()).toBe(false);

      soundService.setEnabled(true);
      expect(soundService.getEnabled()).toBe(true);
    });

    it('safely handles play events without throwing exceptions', () => {
      expect(() => {
        soundService.play('move');
        soundService.play('capture');
        soundService.play('check');
        soundService.play('castle');
        soundService.play('promotion');
        soundService.play('gameStart');
        soundService.play('gameEnd');
        soundService.play('lowTime');
      }).not.toThrow();
    });
  });
});
