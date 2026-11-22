import React, { useEffect } from 'react';
import { StyleSheet, AppState, AppStateStatus, SafeAreaView, View, useColorScheme, BackHandler } from 'react-native';
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

  const systemColorScheme = useColorScheme();
  const theme = resolveThemeColors(themePreset, systemColorScheme);
  const colors = theme.colors;

  // Initialize notifications and rehydrate persisted plan & timer state
  useEffect(() => {
    NotificationService.init();
    loadPersistedState();
  }, [loadPersistedState]);

  // Foreground tick timer loop
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
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
  },
  content: {
    flex: 1,
  },
});
