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

      await notifee.createChannel({
        id: 'pomodoro_ongoing',
        name: 'Ongoing Focus Timer',
        importance: AndroidImportance.LOW,
        vibration: false,
      });

      await notifee.createChannel({
        id: 'pomodoro_alarm',
        name: 'Stage Completion Alarm',
        importance: AndroidImportance.HIGH,
        sound: 'default',
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

  static async showCompletionAlarm(stageName: string, nextStageName: string) {
    if (!notifee || Platform.OS !== 'android') return;

    try {
      await this.cancelOngoing();

      await notifee.displayNotification({
        id: 'pomodoro_completed',
        title: `🎉 ${stageName} Finished!`,
        body: `Ready for ${nextStageName}? Tap to begin.`,
        android: {
          channelId: 'pomodoro_alarm',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to display completion alarm:', err);
    }
  }
}
