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

  /**
   * Play standard single-block transition chime (two-tone bell: C5 -> E5)
   */
  static playStageCompleteSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Tone 1: C5 (523.25 Hz)
      this.playTone(ctx, 523.25, now, 0.25, 0.15);
      // Tone 2: E5 (659.25 Hz)
      this.playTone(ctx, 659.25, now + 0.15, 0.4, 0.18);
    } catch {}
  }

  /**
   * Play DISTINCT full-cycle completion celebratory fanfare (Ascending C Major chord with harmonic richness)
   */
  static playCycleCompleteSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Note 1: C5 (523.25 Hz)
      this.playTone(ctx, 523.25, now, 0.3, 0.18);
      // Note 2: E5 (659.25 Hz)
      this.playTone(ctx, 659.25, now + 0.14, 0.3, 0.18);
      // Note 3: G5 (783.99 Hz)
      this.playTone(ctx, 783.99, now + 0.28, 0.35, 0.2);
      // Note 4: C6 (1046.50 Hz) - Triumphant peak with sustained ring
      this.playTone(ctx, 1046.5, now + 0.42, 0.8, 0.25);
      // Harmonic octave base: C4 (261.63 Hz) warm support
      this.playTone(ctx, 261.63, now + 0.42, 0.8, 0.15, 'triangle');
    } catch {}
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

      // Smooth attack & decay
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
