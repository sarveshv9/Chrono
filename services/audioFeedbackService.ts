import { NativeModules, Platform } from 'react-native';

interface ToneNote {
  freq: number;
  startSec: number;
  durationSec: number;
  volume: number;
  wave?: 'sine' | 'triangle';
}

export class AudioFeedbackService {
  private static audioCtx: any = null;

  private static getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private static playWebNotes(notes: ToneNote[]) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const n of notes) {
        this.playTone(ctx, n.freq, now + n.startSec, n.durationSec, n.volume, n.wave);
      }
    } catch {}
  }

  /**
   * Play soothing, gentle release chime when a FOCUS session ends (entering break).
   * Mellow descending Zen tone (E5 -> A4 with warm sub-harmonic A3).
   */
  static playFocusCompleteSound() {
    if (Platform.OS === 'android') {
      try {
        NativeModules.PomodoroNotification?.playChime?.('focus_complete');
      } catch {}
      return;
    }

    this.playWebNotes([
      { freq: 659.25, startSec: 0, durationSec: 0.45, volume: 0.25 },
      { freq: 440.0, startSec: 0.18, durationSec: 0.75, volume: 0.28 },
      { freq: 220.0, startSec: 0.18, durationSec: 0.75, volume: 0.18, wave: 'triangle' },
    ]);
  }

  /**
   * Play crisp, energizing prompt chime when a BREAK ends (entering focus).
   * Bright ascending major triad (D5 -> F#5 -> A5) to invigorate and alert.
   */
  static playBreakCompleteSound() {
    if (Platform.OS === 'android') {
      try {
        NativeModules.PomodoroNotification?.playChime?.('break_complete');
      } catch {}
      return;
    }

    this.playWebNotes([
      { freq: 587.33, startSec: 0, durationSec: 0.22, volume: 0.25 },
      { freq: 739.99, startSec: 0.12, durationSec: 0.25, volume: 0.28 },
      { freq: 880.0, startSec: 0.24, durationSec: 0.5, volume: 0.32 },
    ]);
  }

  /**
   * Route stage completion sound based on whether focus or break just finished.
   */
  static playStageCompleteSound(completedType: 'focus' | 'short' | 'long' = 'focus') {
    if (completedType === 'focus') {
      this.playFocusCompleteSound();
    } else {
      this.playBreakCompleteSound();
    }
  }

  /**
   * Play DISTINCT full-cycle completion celebratory fanfare (Ascending C Major chord with harmonic richness).
   */
  static playCycleCompleteSound() {
    if (Platform.OS === 'android') {
      try {
        NativeModules.PomodoroNotification?.playChime?.('cycle_complete');
      } catch {}
      return;
    }

    this.playWebNotes([
      { freq: 523.25, startSec: 0, durationSec: 0.3, volume: 0.24 },
      { freq: 659.25, startSec: 0.14, durationSec: 0.3, volume: 0.24 },
      { freq: 783.99, startSec: 0.28, durationSec: 0.35, volume: 0.26 },
      { freq: 1046.5, startSec: 0.42, durationSec: 0.8, volume: 0.32 },
      { freq: 261.63, startSec: 0.42, durationSec: 0.8, volume: 0.2, wave: 'triangle' },
    ]);
  }

  private static playTone(
    ctx: any,
    freq: number,
    startTime: number,
    duration: number,
    peakVolume: number,
    type: string = 'sine'
  ) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {}
  }
}
