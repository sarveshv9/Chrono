import React, { useEffect } from 'react';
import { StyleSheet, AppState, AppStateStatus, View } from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { NotificationService } from '@/services/notificationService';
import { ZenCanvas } from '@/components/ZenCanvas';

export default function App() {
  const tick = useTimerStore((state) => state.tick);
  const reconcile = useTimerStore((state) => state.reconcile);
  const loadPersistedState = useTimerStore((state) => state.loadPersistedState);
  const status = useTimerStore((state) => state.status);

  // Initialize notifications and rehydrate state
  useEffect(() => {
    NotificationService.init();
    loadPersistedState();
  }, []);

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
    <View style={styles.container}>
      <ZenCanvas />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
