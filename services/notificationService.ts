import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

export type BlockKind = 'focus' | 'short' | 'long';

export interface OngoingNotificationOptions {
  subtitle?: string;
  totalDurationMs?: number;
  blockType?: BlockKind;
}

export interface NotificationActionHandlers {
  onPause?: () => void;
  onResume?: () => void;
  onExtend5m?: () => void;
  onSkip?: () => void;
  onTimerExpired?: () => void;
}

interface PomodoroNotificationNativeModule {
  initChannels: () => void;
  showOngoing: (
    stageName: string,
    subtitle: string,
    targetEndTime: number,
    totalDurationMs: number,
    blockType: string
  ) => void;
  showPaused: (
    stageName: string,
    subtitle: string,
    remainingMs: number,
    totalDurationMs: number,
    blockType: string
  ) => void;
  cancelOngoing: () => void;
  showCompletionAlarm: (completedType: string, stageName: string, nextStageName: string) => void;
  showCycleCompletionAlarm: (sessionCount: number) => void;
}

const nativeModule: PomodoroNotificationNativeModule | undefined =
  Platform.OS === 'android' ? NativeModules.PomodoroNotification : undefined;

export class NotificationService {
  private static subscription: { remove: () => void } | null = null;
  private static handlers: NotificationActionHandlers = {};

  static setActionHandlers(handlers: NotificationActionHandlers) {
    this.handlers = handlers;
  }

  static async init() {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('POST_NOTIFICATIONS permission denied');
        }
      }

      nativeModule.initChannels();

      if (!this.subscription) {
        const emitter = new NativeEventEmitter(NativeModules.PomodoroNotification);
        this.subscription = emitter.addListener('PomodoroNotificationAction', (...args: unknown[]) => {
          const action = typeof args[0] === 'string' ? args[0] : '';
          switch (action) {
            case 'ACTION_PAUSE':
              this.handlers.onPause?.();
              break;
            case 'ACTION_RESUME':
              this.handlers.onResume?.();
              break;
            case 'ACTION_EXTEND_5M':
              this.handlers.onExtend5m?.();
              break;
            case 'ACTION_SKIP':
              this.handlers.onSkip?.();
              break;
            case 'TIMER_EXPIRED_NATIVE':
              this.handlers.onTimerExpired?.();
              break;
          }
        });
      }
    } catch (err) {
      console.warn('Failed to init Android live notifications:', err);
    }
  }

  static async showOngoing(
    stageName: string,
    targetEndTime: number,
    options: OngoingNotificationOptions = {}
  ) {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      const subtitle = options.subtitle || 'Session in progress';
      const totalDurationMs = options.totalDurationMs || Math.max(1000, targetEndTime - Date.now());
      const blockType = options.blockType || 'focus';
      nativeModule.showOngoing(stageName, subtitle, targetEndTime, totalDurationMs, blockType);
    } catch (err) {
      console.warn('Failed to display ongoing notification:', err);
    }
  }

  static async showPaused(
    stageName: string,
    remainingMs: number,
    options: OngoingNotificationOptions = {}
  ) {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      const subtitle = options.subtitle || 'Paused';
      const totalDurationMs = options.totalDurationMs || Math.max(1000, remainingMs);
      const blockType = options.blockType || 'focus';
      nativeModule.showPaused(stageName, subtitle, remainingMs, totalDurationMs, blockType);
    } catch (err) {
      console.warn('Failed to display paused notification:', err);
    }
  }

  static async cancelOngoing() {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      nativeModule.cancelOngoing();
    } catch {}
  }

  /**
   * Display completion notification with distinct sounds and vibrations for Focus vs Break
   */
  static async showCompletionAlarm(
    completedType: 'focus' | 'short' | 'long',
    stageName: string,
    nextStageName: string
  ) {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      nativeModule.showCompletionAlarm(completedType, stageName, nextStageName);
    } catch (err) {
      console.warn('Failed to display completion alarm:', err);
    }
  }

  static async showCycleCompletionAlarm(sessionCount: number) {
    if (Platform.OS !== 'android' || !nativeModule) return;

    try {
      nativeModule.showCycleCompletionAlarm(sessionCount);
    } catch (err) {
      console.warn('Failed to display cycle completion alarm:', err);
    }
  }
}
