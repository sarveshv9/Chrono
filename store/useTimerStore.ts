import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreset } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';
import { NotificationService } from '@/services/notificationService';

export type StageType = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type ClockStyle = 'ring' | 'flip' | 'sandglass' | 'breathing';

export interface TimerSettings {
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  visualClockStyle: ClockStyle;
  themePreset: ThemePreset;
  activeTag: string;
}

export interface TimerState {
  // Configurable Settings
  settings: TimerSettings;

  // Runtime State
  status: TimerStatus;
  stage: StageType;
  cycleCount: number;
  targetEndTime: number | null;
  remainingMs: number;
  totalDurationMs: number;

  // Telemetry Stats
  stats: {
    totalFocusMinutes: number;
    completedSessions: number;
    streakDays: number;
  };

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggleStartPause: () => void;
  reset: () => void;
  skip: () => void;
  extendFiveMinutes: () => void;
  tick: () => void;
  reconcile: () => void;
  setStage: (stage: StageType) => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  loadPersistedState: () => Promise<void>;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  hapticsEnabled: true,
  soundEnabled: true,
  visualClockStyle: 'ring',
  themePreset: 'oled',
  activeTag: 'Deep Work',
};

const STORAGE_KEY = '@chronocraft_timer_state_v1';

export const useTimerStore = create<TimerState>((set, get) => {
  const getDurationForStage = (stage: StageType, settings: TimerSettings) => {
    switch (stage) {
      case 'focus':
        return settings.focusDurationMin * 60 * 1000;
      case 'shortBreak':
        return settings.shortBreakDurationMin * 60 * 1000;
      case 'longBreak':
        return settings.longBreakDurationMin * 60 * 1000;
    }
  };

  const persist = async () => {
    try {
      const { settings, stats, cycleCount } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, stats, cycleCount })
      );
    } catch {}
  };

  return {
    settings: DEFAULT_SETTINGS,
    status: 'idle',
    stage: 'focus',
    cycleCount: 1,
    targetEndTime: null,
    remainingMs: DEFAULT_SETTINGS.focusDurationMin * 60 * 1000,
    totalDurationMs: DEFAULT_SETTINGS.focusDurationMin * 60 * 1000,
    stats: {
      totalFocusMinutes: 0,
      completedSessions: 0,
      streakDays: 1,
    },

    loadPersistedState: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          const stageDuration = getDurationForStage('focus', settings);
          set({
            settings,
            stats: parsed.stats || { totalFocusMinutes: 0, completedSessions: 0, streakDays: 1 },
            cycleCount: parsed.cycleCount || 1,
            remainingMs: stageDuration,
            totalDurationMs: stageDuration,
          });
        }
      } catch {}
    },

    start: () => {
      const { stage, settings, remainingMs } = get();
      const now = Date.now();
      const targetEndTime = now + remainingMs;

      set({
        status: 'running',
        targetEndTime,
      });

      if (settings.hapticsEnabled) {
        HapticService.toggleTimer();
      }

      const stageLabels: Record<StageType, string> = {
        focus: 'Focus Session',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
      };
      NotificationService.showOngoing(stageLabels[stage], targetEndTime);
    },

    pause: () => {
      const { targetEndTime, settings } = get();
      if (!targetEndTime) return;

      const remainingMs = Math.max(0, targetEndTime - Date.now());
      set({
        status: 'paused',
        targetEndTime: null,
        remainingMs,
      });

      if (settings.hapticsEnabled) {
        HapticService.toggleTimer();
      }

      NotificationService.cancelOngoing();
    },

    resume: () => {
      get().start();
    },

    toggleStartPause: () => {
      const { status } = get();
      if (status === 'running') {
        get().pause();
      } else {
        get().start();
      }
    },

    reset: () => {
      const { stage, settings } = get();
      const duration = getDurationForStage(stage, settings);
      set({
        status: 'idle',
        targetEndTime: null,
        remainingMs: duration,
        totalDurationMs: duration,
      });

      NotificationService.cancelOngoing();
    },

    skip: () => {
      const { stage, cycleCount, settings } = get();
      NotificationService.cancelOngoing();

      let nextStage: StageType = 'focus';
      let nextCycle = cycleCount;

      if (stage === 'focus') {
        if (cycleCount >= settings.longBreakInterval) {
          nextStage = 'longBreak';
        } else {
          nextStage = 'shortBreak';
        }
      } else {
        nextStage = 'focus';
        if (stage === 'longBreak') {
          nextCycle = 1;
        } else {
          nextCycle = cycleCount + 1;
        }
      }

      const duration = getDurationForStage(nextStage, settings);
      set({
        stage: nextStage,
        cycleCount: nextCycle,
        status: 'idle',
        targetEndTime: null,
        remainingMs: duration,
        totalDurationMs: duration,
      });

      if (settings.hapticsEnabled) {
        HapticService.stageComplete();
      }
    },

    extendFiveMinutes: () => {
      const extraMs = 5 * 60 * 1000;
      const { status, targetEndTime, remainingMs, totalDurationMs, stage, settings } = get();

      if (status === 'running' && targetEndTime) {
        const newTarget = targetEndTime + extraMs;
        set({
          targetEndTime: newTarget,
          remainingMs: Math.max(0, newTarget - Date.now()),
          totalDurationMs: totalDurationMs + extraMs,
        });
        const stageLabels: Record<StageType, string> = {
          focus: 'Focus Session',
          shortBreak: 'Short Break',
          longBreak: 'Long Break',
        };
        NotificationService.showOngoing(stageLabels[stage], newTarget);
      } else {
        const newRemaining = remainingMs + extraMs;
        set({
          remainingMs: newRemaining,
          totalDurationMs: totalDurationMs + extraMs,
        });
      }

      if (settings.hapticsEnabled) {
        HapticService.extendTime();
      }
    },

    tick: () => {
      const { status, targetEndTime, stage, cycleCount, settings, stats, totalDurationMs } = get();
      if (status !== 'running' || !targetEndTime) return;

      const now = Date.now();
      const remainingMs = Math.max(0, targetEndTime - now);

      if (remainingMs <= 0) {
        // Stage completed!
        NotificationService.cancelOngoing();

        if (settings.hapticsEnabled) {
          HapticService.stageComplete();
        }

        let nextStage: StageType = 'focus';
        let nextCycle = cycleCount;
        let newStats = { ...stats };

        if (stage === 'focus') {
          newStats.completedSessions += 1;
          newStats.totalFocusMinutes += Math.round(totalDurationMs / 60000);
          if (cycleCount >= settings.longBreakInterval) {
            nextStage = 'longBreak';
          } else {
            nextStage = 'shortBreak';
          }
        } else {
          nextStage = 'focus';
          if (stage === 'longBreak') {
            nextCycle = 1;
          } else {
            nextCycle = cycleCount + 1;
          }
        }

        const nextDuration = getDurationForStage(nextStage, settings);

        NotificationService.showCompletionAlarm(
          stage === 'focus' ? 'Focus Session' : 'Break',
          nextStage === 'focus' ? 'Focus Session' : 'Break'
        );

        set({
          stage: nextStage,
          cycleCount: nextCycle,
          status: 'idle',
          targetEndTime: null,
          remainingMs: nextDuration,
          totalDurationMs: nextDuration,
          stats: newStats,
        });

        persist();

        // Auto-start next stage if configured
        const shouldAutoStart =
          (nextStage !== 'focus' && settings.autoStartBreaks) ||
          (nextStage === 'focus' && settings.autoStartFocus);

        if (shouldAutoStart) {
          setTimeout(() => get().start(), 500);
        }
      } else {
        set({ remainingMs });
      }
    },

    reconcile: () => {
      const { status, targetEndTime } = get();
      if (status === 'running' && targetEndTime) {
        const now = Date.now();
        if (now >= targetEndTime) {
          get().tick(); // Triggers completion immediately
        } else {
          set({ remainingMs: Math.max(0, targetEndTime - now) });
        }
      }
    },

    setStage: (newStage: StageType) => {
      const { settings } = get();
      const duration = getDurationForStage(newStage, settings);
      set({
        stage: newStage,
        status: 'idle',
        targetEndTime: null,
        remainingMs: duration,
        totalDurationMs: duration,
      });
      NotificationService.cancelOngoing();
    },

    updateSettings: (newSettings: Partial<TimerSettings>) => {
      const mergedSettings = { ...get().settings, ...newSettings };
      const { stage, status } = get();
      
      let updateObj: any = { settings: mergedSettings };

      if (status === 'idle') {
        const duration = getDurationForStage(stage, mergedSettings);
        updateObj.remainingMs = duration;
        updateObj.totalDurationMs = duration;
      }

      set(updateObj);
      persist();
    },
  };
});
