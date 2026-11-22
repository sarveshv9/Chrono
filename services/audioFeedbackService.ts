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
   * Play soothing, gentle release chime when a FOCUS session ends (entering break).
   * Mellow descending Zen tone (E5 -> A4 with warm sub-harmonic A3).
   */
  static playFocusCompleteSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Tone 1: E5 (659.25 Hz) - gentle bell initiation
      this.playTone(ctx, 659.25, now, 0.45, 0.16);
      // Tone 2: A4 (440.00 Hz) - peaceful resting resolution
      this.playTone(ctx, 440.00, now + 0.18, 0.75, 0.18);
      // Warm grounding undertone: A3 (220.00 Hz)
      this.playTone(ctx, 220.00, now + 0.18, 0.75, 0.12, 'triangle');
    } catch {}
  }

  /**
   * Play crisp, energizing prompt chime when a BREAK ends (entering focus).
   * Bright ascending major triad (D5 -> F#5 -> A5) to invigorate and alert.
   */
  static playBreakCompleteSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Note 1: D5 (587.33 Hz)
      this.playTone(ctx, 587.33, now, 0.22, 0.16);
      // Note 2: F#5 (739.99 Hz)
      this.playTone(ctx, 739.99, now + 0.12, 0.25, 0.18);
      // Note 3: A5 (880.00 Hz) - crisp alert top tone
      this.playTone(ctx, 880.00, now + 0.24, 0.5, 0.22);
    } catch {}
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
