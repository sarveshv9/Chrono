import React, { useEffect } from 'react';
import { StyleSheet, AppState, AppStateStatus, SafeAreaView, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTimerStore } from '@/store/useTimerStore';
import { NotificationService } from '@/services/notificationService';
import { resolveThemeColors } from '@/theme/tokens';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { TimerTab } from '@/components/tabs/TimerTab';
import { TasksTab } from '@/components/tabs/TasksTab';
import { StatsTab } from '@/components/tabs/StatsTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';

export default function App() {
  const tick = useTimerStore((state) => state.tick);
  const reconcile = useTimerStore((state) => state.reconcile);
  const loadPersistedState = useTimerStore((state) => state.loadPersistedState);
  const status = useTimerStore((state) => state.status);
  const activeTab = useTimerStore((state) => state.activeTab);
  const themePreset = useTimerStore((state) => state.settings.themePreset);

  const systemColorScheme = useColorScheme();
  const theme = resolveThemeColors(themePreset, systemColorScheme);
  const colors = theme.colors;

  // Initialize notifications and rehydrate state
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.content}>
        {activeTab === 'timer' && <TimerTab colors={colors} />}
        {activeTab === 'tasks' && <TasksTab colors={colors} />}
        {activeTab === 'stats' && <StatsTab colors={colors} />}
        {activeTab === 'settings' && <SettingsTab colors={colors} />}
      </View>

      <BottomTabBar colors={colors} />
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
