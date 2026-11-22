import { Platform } from 'react-native';

let notifee: any = null;
let AndroidImportance: any = null;
let AndroidColor: any = null;

try {
  const notifeeModule = require('@notifee/react-native');
  notifee = notifeeModule.default || notifeeModule;
  AndroidImportance = notifeeModule.AndroidImportance;
  AndroidColor = notifeeModule.AndroidColor;
} catch {
  // Graceful fallback for development / web
}

export class NotificationService {
  private static ongoingNotificationId = 'pomodoro_ongoing_session';

  static async init() {
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await notifee.requestPermission();

      // Channel 1: Persistent countdown timer while running
      await notifee.createChannel({
        id: 'pomodoro_ongoing',
        name: 'Ongoing Focus Timer',
        importance: AndroidImportance.LOW,
        vibration: false,
      });

      // Channel 2: Focus Session Finished -> Time to relax
      await notifee.createChannel({
        id: 'pomodoro_focus_complete',
        name: 'Focus Finished (Break Time)',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Channel 3: Break Finished -> Time to jump back in
      await notifee.createChannel({
        id: 'pomodoro_break_complete',
        name: 'Break Finished (Focus Time)',
        importance: AndroidImportance.HIGH,
        sound: 'alarm',
        vibration: true,
      });

      // Channel 4: All Sessions Finished -> Full celebration
      await notifee.createChannel({
        id: 'pomodoro_cycle_complete',
        name: 'Full Cycle Celebration',
        importance: AndroidImportance.HIGH,
        sound: 'alarm',
        vibration: true,
      });
    } catch (err) {
      console.warn('Failed to init Notifee channels:', err);
    }
  }

  static async showOngoing(stageName: string, targetEndTime: number) {
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await notifee.displayNotification({
        id: this.ongoingNotificationId,
        title: `ChronoCraft: ${stageName}`,
        body: 'Session in progress',
        android: {
          channelId: 'pomodoro_ongoing',
          asForegroundService: true,
          ongoing: true,
          color: AndroidColor?.GREEN || '#00FFCC',
          chronometer: {
            base: targetEndTime,
            down: true,
          },
          actions: [
            {
              title: '⏸ Pause',
              pressAction: { id: 'ACTION_PAUSE' },
            },
            {
              title: '➕ +5m',
              pressAction: { id: 'ACTION_EXTEND_5M' },
            },
            {
              title: '⏭ Skip',
              pressAction: { id: 'ACTION_SKIP' },
            },
          ],
        },
      });
    } catch (err) {
      console.warn('Failed to display ongoing notification:', err);
    }
  }

  static async cancelOngoing() {
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await notifee.cancelNotification(this.ongoingNotificationId);
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
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await this.cancelOngoing();

      const isFocus = completedType === 'focus';
      const channelId = isFocus ? 'pomodoro_focus_complete' : 'pomodoro_break_complete';
      const title = isFocus ? `🌿 ${stageName} Finished!` : `⚡ ${stageName} Finished!`;
      const body = isFocus
        ? `Great job! Time for ${nextStageName.toLowerCase()}. Tap to begin.`
        : `${nextStageName} is starting now. Let's get focused!`;

      // Distinct vibration profiles:
      // Focus: gentle rhythmic pulses
      // Break: alert staccato pulses
      const vibrationPattern = isFocus
        ? [0, 450, 250, 450]
        : [0, 200, 100, 200, 100, 300];

      await notifee.displayNotification({
        id: 'pomodoro_completed',
        title,
        body,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: isFocus ? 'default' : 'alarm',
          vibrationPattern,
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to display completion alarm:', err);
    }
  }

  static async showCycleCompletionAlarm(sessionCount: number) {
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await this.cancelOngoing();

      await notifee.displayNotification({
        id: 'pomodoro_cycle_completed',
        title: '🏆 Cycle Completed! Outstanding Work!',
        body: `You finished all ${sessionCount} focus sessions and breaks. Outstanding focus!`,
        android: {
          channelId: 'pomodoro_cycle_complete',
          importance: AndroidImportance.HIGH,
          sound: 'alarm',
          vibrationPattern: [0, 400, 200, 400, 200, 800],
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to display cycle completion alarm:', err);
    }
  }
}
