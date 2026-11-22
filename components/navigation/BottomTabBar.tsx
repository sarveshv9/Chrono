import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTimerStore, NavigationTab } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface BottomTabBarProps {
  colors: ThemeColors;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ colors }) => {
  const activeTab = useTimerStore((state) => state.activeTab);
  const setActiveTab = useTimerStore((state) => state.setActiveTab);
  const status = useTimerStore((state) => state.status);

  // Auto-hide tab bar during running session for distraction-free focus
  if (status === 'running') {
    return null;
  }

  const tabs: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'timer', label: 'Timer', icon: '⏱' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            style={styles.tabButton}
            onPress={() => {
              HapticService.buttonPress();
              setActiveTab(tab.id);
            }}
          >
            <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.accentFocus : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
