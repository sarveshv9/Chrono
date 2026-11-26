import React, { useEffect } from 'react';
import {
  StyleSheet,
  AppState,
  AppStateStatus,
  SafeAreaView,
  View,
  BackHandler,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTimerStore } from '@/store/useTimerStore';
import { NotificationService } from '@/services/notificationService';
import { resolveThemeColors } from '@/theme/tokens';
import { TimerScreen } from '@/components/screens/TimerScreen';
import { PlanScreen } from '@/components/screens/PlanScreen';

export default function App() {
  const tick = useTimerStore((state) => state.tick);
  const reconcile = useTimerStore((state) => state.reconcile);
  const loadPersistedState = useTimerStore((state) => state.loadPersistedState);
  const status = useTimerStore((state) => state.status);
  const currentScreen = useTimerStore((state) => state.currentScreen);
  const setCurrentScreen = useTimerStore((state) => state.setCurrentScreen);
  const themePreset = useTimerStore((state) => state.plan.themePreset);

  const theme = resolveThemeColors(themePreset);
  const colors = theme.colors;

  // Initialize notifications and rehydrate persisted plan & timer state
  useEffect(() => {
    NotificationService.setActionHandlers({
      onStart: () => useTimerStore.getState().start(),
      onPause: () => useTimerStore.getState().pause(),
      onResume: () => useTimerStore.getState().resume(),
      onExtend5m: () => useTimerStore.getState().extendCurrentBlock(5),
      onSkip: () => useTimerStore.getState().skip(),
      onTimerExpired: () => useTimerStore.getState().reconcile(),
    });
    NotificationService.init();
    loadPersistedState();
  }, [loadPersistedState]);

  // Foreground tick timer loop aligned to second boundaries
  useEffect(() => {
    if (status !== 'running') return;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const scheduleNext = () => {
      const target = useTimerStore.getState().targetEndTime;
      const msLeft = target ? Math.max(0, target - Date.now()) : 1000;
      const delay = msLeft <= 1000 ? Math.max(16, msLeft + 10) : (msLeft % 1000) + 15;

      timerId = setTimeout(() => {
        tick();
        if (useTimerStore.getState().status === 'running') {
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [status, tick]);

  // Zero-drift AppState reconciler
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        reconcile();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [reconcile]);

  // Hardware Android Back button support
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'plan') {
        setCurrentScreen('timer');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen, setCurrentScreen]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.content}>
        {currentScreen === 'timer' ? (
          <TimerScreen colors={colors} />
        ) : (
          <PlanScreen colors={colors} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0,
  },
  content: {
    flex: 1,
  },
});
