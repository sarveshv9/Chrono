import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class HapticService {
  static tick() {
    if (Platform.OS === 'android') {
      try {
        Haptics.selectionAsync();
      } catch {
        // Fallback or mute if device has no vibrator
      }
    }
  }

  static buttonPress() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }

  static toggleTimer() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }

  static stageComplete() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  static celebration() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
      }, 200);
      setTimeout(() => {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }, 450);
    } catch {}
  }

  static extendTime() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }
}
