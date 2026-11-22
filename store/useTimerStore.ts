import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreset } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';
import { NotificationService } from '@/services/notificationService';

export type StageType = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type ClockStyle = 'ring' | 'flip' | 'sandglass' | 'breathing';
export type NavigationTab = 'timer' | 'tasks' | 'stats' | 'settings';

export interface TaskItem {
  id: string;
  name: string;
  color: string;
  completedSessions: number;
}

export interface SessionHistoryItem {
  id: string;
  stage: StageType;
  durationMinutes: number;
  completedAt: string;
  taskName: string;
}

export interface TimerSettings {
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  keepScreenAwake: boolean;
  dailyGoalSessions: number;
  visualClockStyle: ClockStyle;
  themePreset: ThemePreset;
}

export interface TimerState {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Settings
  settings: TimerSettings;

  // Tasks
  tasks: TaskItem[];
  activeTaskId: string;
  setActiveTaskId: (id: string) => void;
  addTask: (name: string, color?: string) => void;
  deleteTask: (id: string) => void;

  // Runtime State
  status: TimerStatus;
  stage: StageType;
  cycleCount: number; // 1 to longBreakInterval
  targetEndTime: number | null;
  remainingMs: number;
  totalDurationMs: number;

  // History & Telemetry
  history: SessionHistoryItem[];
  stats: {
    totalFocusMinutes: number;
    completedSessions: number;
    streakDays: number;
  };

  // Actions
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  extendFiveMinutes: () => void;
  setStage: (stage: StageType) => void;
  setCurrentDurationMin: (minutes: number) => void;
  tick: () => void;
  reconcile: () => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  clearHistory: () => void;
  loadPersistedState: () => Promise<void>;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  hapticsEnabled: true,
  soundEnabled: true,
  keepScreenAwake: true,
  dailyGoalSessions: 6,
  visualClockStyle: 'ring',
  themePreset: 'system',
};

const DEFAULT_TASKS: TaskItem[] = [
  { id: 'task_1', name: 'Deep Work', color: '#FF453A', completedSessions: 3 },
  { id: 'task_2', name: 'Code Review', color: '#0A84FF', completedSessions: 1 },
  { id: 'task_3', name: 'Study & Reading', color: '#30D158', completedSessions: 0 },
];

const STORAGE_KEY = '@chronocraft_pomodoro_v2';

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
      const { settings, stats, tasks, history, cycleCount } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, stats, tasks, history, cycleCount })
      );
    } catch {}
  };

  return {
    activeTab: 'timer',
    setActiveTab: (tab) => set({ activeTab: tab }),

    settings: DEFAULT_SETTINGS,
    tasks: DEFAULT_TASKS,
    activeTaskId: 'task_1',

    status: 'idle',
    stage: 'focus',
    cycleCount: 1,
    targetEndTime: null,
    remainingMs: DEFAULT_SETTINGS.focusDurationMin * 60 * 1000,
    totalDurationMs: DEFAULT_SETTINGS.focusDurationMin * 60 * 1000,

    history: [],
    stats: {
      totalFocusMinutes: 75,
      completedSessions: 3,
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
            stats: parsed.stats || { totalFocusMinutes: 75, completedSessions: 3, streakDays: 1 },
            tasks: parsed.tasks?.length ? parsed.tasks : DEFAULT_TASKS,
            history: parsed.history || [],
            cycleCount: parsed.cycleCount || 1,
            remainingMs: stageDuration,
            totalDurationMs: stageDuration,
          });
        }
      } catch {}
    },

    setActiveTaskId: (id) => {
      set({ activeTaskId: id });
      persist();
    },

    addTask: (name, color = '#FF453A') => {
      const newTask: TaskItem = {
        id: `task_${Date.now()}`,
        name: name.trim() || 'Untitled Task',
        color,
        completedSessions: 0,
      };
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        activeTaskId: newTask.id,
      }));
      persist();
    },

    deleteTask: (id) => {
      set((state) => {
        const remaining = state.tasks.filter((t) => t.id !== id);
        return {
          tasks: remaining,
          activeTaskId: remaining[0]?.id || '',
        };
      });
      persist();
    },

    start: async () => {
      const { stage, settings, remainingMs, tasks, activeTaskId } = get();
      const now = Date.now();
      const targetEndTime = now + remainingMs;

      set({
        status: 'running',
        targetEndTime,
      });

      if (settings.hapticsEnabled) {
        HapticService.toggleTimer();
      }

      const activeTask = tasks.find((t) => t.id === activeTaskId)?.name || 'Focus Session';
      const stageLabels: Record<StageType, string> = {
        focus: activeTask,
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

    stop: () => {
      const { stage, settings } = get();
      const duration = getDurationForStage(stage, settings);
      set({
        status: 'idle',
        targetEndTime: null,
        remainingMs: duration,
        totalDurationMs: duration,
      });

      if (settings.hapticsEnabled) {
        HapticService.buttonPress();
      }

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
      const { status, targetEndTime, remainingMs, totalDurationMs, stage, settings, tasks, activeTaskId } = get();

      if (status === 'running' && targetEndTime) {
        const newTarget = targetEndTime + extraMs;
        set({
          targetEndTime: newTarget,
          remainingMs: Math.max(0, newTarget - Date.now()),
          totalDurationMs: totalDurationMs + extraMs,
        });

        const activeTask = tasks.find((t) => t.id === activeTaskId)?.name || 'Focus Session';
        const stageLabels: Record<StageType, string> = {
          focus: activeTask,
          shortBreak: 'Short Break',
          longBreak: 'Long Break',
        };
        NotificationService.showOngoing(stageLabels[stage], newTarget);
      } else {
        set({
          remainingMs: remainingMs + extraMs,
          totalDurationMs: totalDurationMs + extraMs,
        });
      }

      if (settings.hapticsEnabled) {
        HapticService.extendTime();
      }
    },

    setStage: (newStage) => {
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

    setCurrentDurationMin: (minutes) => {
      const ms = minutes * 60 * 1000;
      const { stage, settings } = get();
      const updatedSettings = { ...settings };

      if (stage === 'focus') updatedSettings.focusDurationMin = minutes;
      else if (stage === 'shortBreak') updatedSettings.shortBreakDurationMin = minutes;
      else if (stage === 'longBreak') updatedSettings.longBreakDurationMin = minutes;

      set({
        settings: updatedSettings,
        remainingMs: ms,
        totalDurationMs: ms,
        status: 'idle',
        targetEndTime: null,
      });

      persist();
    },

    tick: () => {
      const { status, targetEndTime, stage, cycleCount, settings, stats, tasks, activeTaskId, totalDurationMs, history } = get();
      if (status !== 'running' || !targetEndTime) return;

      const now = Date.now();
      const remainingMs = Math.max(0, targetEndTime - now);

      if (remainingMs <= 0) {
        NotificationService.cancelOngoing();

        if (settings.hapticsEnabled) {
          HapticService.stageComplete();
        }

        let nextStage: StageType = 'focus';
        let nextCycle = cycleCount;
        let newStats = { ...stats };
        let updatedTasks = [...tasks];
        const activeTask = tasks.find((t) => t.id === activeTaskId);
        const taskName = activeTask?.name || 'Focus Session';

        if (stage === 'focus') {
          const sessionMinutes = Math.round(totalDurationMs / 60000);
          newStats.completedSessions += 1;
          newStats.totalFocusMinutes += sessionMinutes;

          if (activeTask) {
            updatedTasks = tasks.map((t) =>
              t.id === activeTaskId ? { ...t, completedSessions: t.completedSessions + 1 } : t
            );
          }

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

        const newHistoryItem: SessionHistoryItem = {
          id: `hist_${Date.now()}`,
          stage,
          durationMinutes: Math.round(totalDurationMs / 60000),
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          taskName,
        };

        NotificationService.showCompletionAlarm(
          stage === 'focus' ? taskName : 'Break',
          nextStage === 'focus' ? 'Focus Session' : 'Break'
        );

        set({
          stage: nextStage,
          cycleCount: nextCycle,
          status: 'completed',
          targetEndTime: null,
          remainingMs: nextDuration,
          totalDurationMs: nextDuration,
          stats: newStats,
          tasks: updatedTasks,
          history: [newHistoryItem, ...history.slice(0, 49)],
        });

        persist();

        const shouldAutoStart =
          (nextStage !== 'focus' && settings.autoStartBreaks) ||
          (nextStage === 'focus' && settings.autoStartFocus);

        if (shouldAutoStart) {
          setTimeout(() => get().start(), 600);
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
          get().tick();
        } else {
          set({ remainingMs: Math.max(0, targetEndTime - now) });
        }
      }
    },

    updateSettings: (newSettings) => {
      const merged = { ...get().settings, ...newSettings };
      const { stage, status } = get();
      let updateObj: any = { settings: merged };

      if (status === 'idle') {
        const duration = getDurationForStage(stage, merged);
        updateObj.remainingMs = duration;
        updateObj.totalDurationMs = duration;
      }

      set(updateObj);
      persist();
    },

    clearHistory: () => {
      set({
        history: [],
        stats: { totalFocusMinutes: 0, completedSessions: 0, streakDays: 1 },
      });
      persist();
    },
  };
});
