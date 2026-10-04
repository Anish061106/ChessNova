export type SoundEvent =
  | 'move'
  | 'capture'
  | 'check'
  | 'castle'
  | 'promotion'
  | 'gameStart'
  | 'gameEnd'
  | 'lowTime';

const SOUND_STORAGE_KEY = 'chessnova_sound_enabled';

class SoundService {
  private isEnabled: boolean;
  private audioCtx: AudioContext | null = null;
  private lastPlayedEvent: { event: SoundEvent; timestamp: number } | null = null;

  constructor() {
    // Read user preference from localStorage, default to true
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      this.isEnabled = stored !== null ? stored === 'true' : true;
    } catch {
      this.isEnabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    const next = !this.isEnabled;
    this.setEnabled(next);
    return next;
  }

  public play(event: SoundEvent): void {
    if (!this.isEnabled) return;

    // Prevent identical audio triggers fired within 50ms
    const now = Date.now();
    if (
      this.lastPlayedEvent &&
      this.lastPlayedEvent.event === event &&
      now - this.lastPlayedEvent.timestamp < 50
    ) {
      return;
    }
    this.lastPlayedEvent = { event, timestamp: now };

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;

      switch (event) {
        case 'move': {
          // Tactile wooden move click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.07);
          break;
        }

        case 'capture': {
          // Punchy acoustic capture knock
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
        }

        case 'check': {
          // Urgent double alert chime
          [0, 0.08].forEach((delay, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? 540 : 760, t + delay);

            gain.gain.setValueAtTime(0.3, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.14);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.15);
          });
          break;
        }

        case 'castle': {
          // Double piece slide/placement
          [0, 0.09].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(360, t + delay);
            osc.frequency.exponentialRampToValueAtTime(140, t + delay + 0.06);

            gain.gain.setValueAtTime(0.25, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.07);
          });
          break;
        }

        case 'promotion': {
          // Triumphant ascending arpeggio (C5, E5, G5, C6)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const delay = idx * 0.06;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + delay);

            gain.gain.setValueAtTime(0.2, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.13);
          });
          break;
        }

        case 'gameStart': {
          // Welcoming harmonic start chime (C5 & G5)
          [523.25, 783.99].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.36);
          });
          break;
        }

        case 'gameEnd': {
          // Concluding resonant cadence (G4 -> C4)
          [392.0, 261.63].forEach((freq, idx) => {
            const delay = idx * 0.14;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + delay);

            gain.gain.setValueAtTime(0.28, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + delay);
            osc.stop(t + delay + 0.46);
          });
          break;
        }

        case 'lowTime': {
          // Subtle urgent clock tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, t);

          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
          break;
        }
      }
    } catch {
      // Audio playback fails gracefully if context unavailable
    }
  }
}

export const soundService = new SoundService();
