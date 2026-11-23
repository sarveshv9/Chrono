import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreset } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';
import { NotificationService } from '@/services/notificationService';
import { AudioFeedbackService } from '@/services/audioFeedbackService';

export type BlockType = 'focus' | 'short' | 'long';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type ClockStyle = 'ring' | 'flip' | 'sandglass' | 'breathing';

export interface PomodoroBlock {
  id: string;
  type: BlockType;
  minutes: number;
}

export interface PomodoroPlan {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes?: number;
  sessionCount: number | 'unlimited';
  breakCount: number;
  longBreakEvery?: number | 'never';
  autoStartNext: boolean;
  notifyOnEnd: boolean;
  customSequenceEnabled: boolean;
  customSequence: PomodoroBlock[];
  visualClockStyle: ClockStyle;
  themePreset: ThemePreset;
}

export const DEFAULT_PLAN: PomodoroPlan = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionCount: 4,
  breakCount: 3,
  longBreakEvery: 'never',
  autoStartNext: false,
  notifyOnEnd: true,
  customSequenceEnabled: false,
  customSequence: [
    { id: '1', type: 'focus', minutes: 25 },
    { id: '2', type: 'short', minutes: 5 },
    { id: '3', type: 'focus', minutes: 25 },
    { id: '4', type: 'short', minutes: 5 },
    { id: '5', type: 'focus', minutes: 25 },
    { id: '6', type: 'short', minutes: 5 },
    { id: '7', type: 'focus', minutes: 25 },
    { id: '8', type: 'short', minutes: 5 },
  ],
  visualClockStyle: 'ring',
  themePreset: 'system',
};

// Pure sequence builder - Single Source of Truth
export function buildSequence(plan: PomodoroPlan): PomodoroBlock[] {
  if (plan.customSequenceEnabled && plan.customSequence.length > 0) {
    return plan.customSequence;
  }

  const blocks: PomodoroBlock[] = [];
  const totalSessions = plan.sessionCount === 'unlimited' ? 50 : Math.max(1, plan.sessionCount);
  const maxBreaks = plan.sessionCount === 'unlimited' ? plan.breakCount : Math.min(plan.breakCount, totalSessions);
  const breakMinutes = plan.shortBreakMinutes || 5;

  for (let i = 1; i <= totalSessions; i++) {
    blocks.push({
      id: `block_f_${i}`,
      type: 'focus',
      minutes: Math.max(1, plan.focusMinutes),
    });

    if (i <= maxBreaks) {
      blocks.push({
        id: `block_b_${i}`,
        type: 'short',
        minutes: Math.max(1, breakMinutes),
      });
    }
  }

  return blocks;
}

export function computeTotalPlanMinutes(plan: PomodoroPlan): number {
  const blocks = buildSequence(plan);
  return blocks.reduce((acc, b) => acc + b.minutes, 0);
}

export interface TimerState {
  // Navigation: 'timer' or 'plan'
  currentScreen: 'timer' | 'plan';
  setCurrentScreen: (screen: 'timer' | 'plan') => void;

  // Plan
  plan: PomodoroPlan;
  activeBlocks: PomodoroBlock[];
  currentBlockIndex: number;

  // Runtime Timer State (Timestamp SSOT)
  status: TimerStatus;
  targetEndTime: number | null;
  remainingMs: number;
  totalDurationMs: number;

  // Actions
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  reconcile: () => void;

  // Plan Updates
  updatePlan: (newPlan: Partial<PomodoroPlan>) => void;
  setCurrentBlockMinutes: (minutes: number) => void;
  resetPlanToDefaults: () => void;
  loadPersistedState: () => Promise<void>;
}

const STORAGE_KEY = '@chrono_pomodoro_plan_v3';
const LEGACY_STORAGE_KEY = '@chronocraft_pomodoro_plan_v3';

export const useTimerStore = create<TimerState>((set, get) => {
  const persist = async () => {
    try {
      const { plan, currentBlockIndex, status, targetEndTime, remainingMs, totalDurationMs } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ plan, currentBlockIndex, status, targetEndTime, remainingMs, totalDurationMs })
      );
    } catch {}
  };

  const initialBlocks = buildSequence(DEFAULT_PLAN);
  const firstBlockDuration = (initialBlocks[0]?.minutes || 25) * 60 * 1000;

  return {
    currentScreen: 'timer',
    setCurrentScreen: (screen) => set({ currentScreen: screen }),

    plan: DEFAULT_PLAN,
    activeBlocks: initialBlocks,
    currentBlockIndex: 0,

    status: 'idle',
    targetEndTime: null,
    remainingMs: firstBlockDuration,
    totalDurationMs: firstBlockDuration,

    loadPersistedState: async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          const plan: PomodoroPlan = { ...DEFAULT_PLAN, ...(parsed.plan || {}) };
          const blocks = buildSequence(plan);
          const blockIndex = Math.min(parsed.currentBlockIndex || 0, Math.max(0, blocks.length - 1));
          const currentBlock = blocks[blockIndex] || blocks[0];
          const blockDurationMs = (currentBlock?.minutes || 25) * 60 * 1000;

          // Check if timer was running when app was closed
          let status: TimerStatus = parsed.status === 'paused' ? 'paused' : 'idle';
          let remainingMs = parsed.remainingMs || blockDurationMs;
          let targetEndTime = parsed.targetEndTime || null;

          if (parsed.status === 'running' && targetEndTime) {
            const now = Date.now();
            if (now < targetEndTime) {
              status = 'running';
              remainingMs = targetEndTime - now;
            } else {
              // Completed while closed
              status = 'idle';
              remainingMs = blockDurationMs;
              targetEndTime = null;
            }
          }

          set({
            plan,
            activeBlocks: blocks,
            currentBlockIndex: blockIndex,
            status,
            targetEndTime,
            remainingMs,
            totalDurationMs: parsed.totalDurationMs || blockDurationMs,
          });
        }
      } catch {}
    },

    updatePlan: (newPlanPartial) => {
      const current = get();
      const updatedPlan: PomodoroPlan = { ...current.plan, ...newPlanPartial };

      // Validate breaks count <= sessions count if sessions is limited
      if (updatedPlan.sessionCount !== 'unlimited') {
        updatedPlan.breakCount = Math.min(Math.max(0, updatedPlan.breakCount), updatedPlan.sessionCount);
      }

      const newBlocks = buildSequence(updatedPlan);

      // If timer is idle, apply new duration immediately to current block
      if (current.status === 'idle') {
        const safeIdx = Math.min(current.currentBlockIndex, Math.max(0, newBlocks.length - 1));
        const block = newBlocks[safeIdx] || newBlocks[0];
        const durationMs = (block?.minutes || 25) * 60 * 1000;
        set({
          plan: updatedPlan,
          activeBlocks: newBlocks,
          currentBlockIndex: safeIdx,
          remainingMs: durationMs,
          totalDurationMs: durationMs,
        });
      } else {
        // If timer is running or paused, keep current block running; changes apply to upcoming blocks
        set({
          plan: updatedPlan,
          activeBlocks: newBlocks,
        });
      }

      persist();
    },

    setCurrentBlockMinutes: (minutes: number) => {
      const current = get();
      const validMinutes = Math.max(1, minutes);
      const currentBlock = current.activeBlocks[current.currentBlockIndex] || current.activeBlocks[0];

      if (current.plan.customSequenceEnabled) {
        const updatedSequence = [...current.plan.customSequence];
        if (updatedSequence[current.currentBlockIndex]) {
          updatedSequence[current.currentBlockIndex] = {
            ...updatedSequence[current.currentBlockIndex],
            minutes: validMinutes,
          };
          current.updatePlan({ customSequence: updatedSequence });
        }
      } else {
        if (currentBlock?.type === 'focus') {
          current.updatePlan({ focusMinutes: validMinutes });
        } else {
          current.updatePlan({ shortBreakMinutes: validMinutes });
        }
      }
    },

    resetPlanToDefaults: () => {
      const newBlocks = buildSequence(DEFAULT_PLAN);
      const durationMs = (newBlocks[0]?.minutes || 25) * 60 * 1000;
      set({
        plan: DEFAULT_PLAN,
        activeBlocks: newBlocks,
        currentBlockIndex: 0,
        status: 'idle',
        targetEndTime: null,
        remainingMs: durationMs,
        totalDurationMs: durationMs,
      });
      NotificationService.cancelOngoing();
      persist();
    },

    start: async () => {
      const { remainingMs, activeBlocks, currentBlockIndex, plan } = get();
      const currentBlock = activeBlocks[currentBlockIndex] || activeBlocks[0];
      const now = Date.now();
      const targetEndTime = now + remainingMs;

      set({
        status: 'running',
        targetEndTime,
      });

      HapticService.toggleTimer();

      const blockLabel = currentBlock?.type === 'focus' ? 'Focus Session' : currentBlock?.type === 'long' ? 'Long Break' : 'Break';
      if (plan.notifyOnEnd) {
        NotificationService.showOngoing(blockLabel, targetEndTime);
      }
      persist();
    },

    pause: () => {
      const { targetEndTime } = get();
      if (!targetEndTime) return;

      const remainingMs = Math.max(0, targetEndTime - Date.now());
      set({
        status: 'paused',
        targetEndTime: null,
        remainingMs,
      });

      HapticService.toggleTimer();
      NotificationService.cancelOngoing();
      persist();
    },

    resume: () => {
      get().start();
    },

    reset: () => {
      const { activeBlocks } = get();
      const firstBlock = activeBlocks[0];
      const durationMs = (firstBlock?.minutes || 25) * 60 * 1000;

      set({
        currentBlockIndex: 0,
        status: 'idle',
        targetEndTime: null,
        remainingMs: durationMs,
        totalDurationMs: durationMs,
      });

      HapticService.buttonPress();
      NotificationService.cancelOngoing();
      persist();
    },

    skip: () => {
      const { activeBlocks, currentBlockIndex, plan } = get();
      NotificationService.cancelOngoing();

      const currentBlock = activeBlocks[currentBlockIndex];
      let nextIndex = currentBlockIndex + 1;
      if (nextIndex >= activeBlocks.length) {
        // Entire cycle is finished!
        const focusCount = activeBlocks.filter((b) => b.type === 'focus').length;
        HapticService.celebration();
        AudioFeedbackService.playCycleCompleteSound();

        if (plan.notifyOnEnd) {
          NotificationService.showCycleCompletionAlarm(focusCount);
        }

        set({
          status: 'completed',
          targetEndTime: null,
          remainingMs: 0,
          totalDurationMs: 0,
        });

        persist();
        return;
      }

      const nextBlock = activeBlocks[nextIndex] || activeBlocks[0];
      const durationMs = (nextBlock?.minutes || 25) * 60 * 1000;

      set({
        currentBlockIndex: nextIndex,
        status: 'idle',
        targetEndTime: null,
        remainingMs: durationMs,
        totalDurationMs: durationMs,
      });

      HapticService.stageComplete();
      AudioFeedbackService.playStageCompleteSound(currentBlock?.type);

      if (plan.notifyOnEnd) {
        const currentLabel = currentBlock?.type === 'focus' ? 'Focus Session' : currentBlock?.type === 'long' ? 'Long Break' : 'Break';
        const nextLabel = nextBlock?.type === 'focus' ? 'Focus Session' : nextBlock?.type === 'long' ? 'Long Break' : 'Break';
        NotificationService.showCompletionAlarm(currentBlock?.type || 'focus', currentLabel, nextLabel);
      }

      persist();

      if (plan.autoStartNext) {
        setTimeout(() => get().start(), 500);
      }
    },

    tick: () => {
      const { status, targetEndTime, activeBlocks, currentBlockIndex, plan } = get();
      if (status !== 'running' || !targetEndTime) return;

      const now = Date.now();
      const remainingMs = Math.max(0, targetEndTime - now);

      if (remainingMs <= 0) {
        NotificationService.cancelOngoing();

        const currentBlock = activeBlocks[currentBlockIndex];
        const nextIndex = currentBlockIndex + 1;
        const isCycleFinished = nextIndex >= activeBlocks.length;

        if (isCycleFinished) {
          // Entire cycle is finished!
          const focusCount = activeBlocks.filter((b) => b.type === 'focus').length;
          HapticService.celebration();
          AudioFeedbackService.playCycleCompleteSound();

          if (plan.notifyOnEnd) {
            NotificationService.showCycleCompletionAlarm(focusCount);
          }

          set({
            status: 'completed',
            targetEndTime: null,
            remainingMs: 0,
            totalDurationMs: 0,
          });

          persist();
        } else {
          HapticService.stageComplete();
          AudioFeedbackService.playStageCompleteSound(currentBlock?.type);

          const nextBlock = activeBlocks[nextIndex] || activeBlocks[0];
          const durationMs = (nextBlock?.minutes || 25) * 60 * 1000;

          if (plan.notifyOnEnd) {
            const currentLabel = currentBlock?.type === 'focus' ? 'Focus Session' : currentBlock?.type === 'long' ? 'Long Break' : 'Break';
            const nextLabel = nextBlock?.type === 'focus' ? 'Focus Session' : nextBlock?.type === 'long' ? 'Long Break' : 'Break';
            NotificationService.showCompletionAlarm(currentBlock?.type || 'focus', currentLabel, nextLabel);
          }

          set({
            currentBlockIndex: nextIndex,
            status: 'idle',
            targetEndTime: null,
            remainingMs: durationMs,
            totalDurationMs: durationMs,
          });

          persist();

          if (plan.autoStartNext) {
            setTimeout(() => get().start(), 600);
          }
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
  };
});
