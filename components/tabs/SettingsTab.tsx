import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTimerStore, ClockStyle } from '@/store/useTimerStore';
import { ThemePreset, ThemeColors, THEME_DEFINITIONS } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface SettingsTabProps {
  colors: ThemeColors;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ colors }) => {
  const settings = useTimerStore((state) => state.settings);
  const updateSettings = useTimerStore((state) => state.updateSettings);
  const clearHistory = useTimerStore((state) => state.clearHistory);

  const [activePicker, setActivePicker] = useState<string | null>(null);

  const themeOptions: { id: ThemePreset; label: string }[] = [
    { id: 'system', label: 'Follow System' },
    { id: 'oled', label: 'OLED Obsidian' },
    { id: 'papyrus', label: 'Warm Papyrus' },
    { id: 'neon', label: 'Cyber Neon' },
    { id: 'matcha', label: 'Matcha Calm' },
  ];

  const clockStyleOptions: { id: ClockStyle; label: string }[] = [
    { id: 'ring', label: 'Circular Ring' },
    { id: 'sandglass', label: 'Digital Minimal' },
    { id: 'flip', label: 'Retro Flip Clock' },
    { id: 'breathing', label: 'Zen Breathing' },
  ];

  const durationOptions = [15, 20, 25, 30, 45, 50, 60];
  const shortBreakOptions = [3, 5, 8, 10];
  const longBreakOptions = [10, 15, 20, 30];
  const intervalOptions = [2, 3, 4, 6];
  const goalOptions = [4, 6, 8, 10, 12];

  const renderRow = (
    label: string,
    value: string,
    onPress?: () => void,
    isDestructive = false
  ) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text
        style={[
          styles.rowLabel,
          { color: isDestructive ? colors.danger : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
        {onPress && <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderSwitchRow = (
    label: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(val) => {
          HapticService.buttonPress();
          onValueChange(val);
        }}
        thumbColor={value ? colors.accentFocus : '#888'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
      <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
        Configure timing, automation, appearance, and audio
      </Text>

      {/* TIMER SECTION */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>TIMER</Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {renderRow('Focus length', `${settings.focusDurationMin} min`, () => setActivePicker('focus'))}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderRow('Short break', `${settings.shortBreakDurationMin} min`, () => setActivePicker('shortBreak'))}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderRow('Long break', `${settings.longBreakDurationMin} min`, () => setActivePicker('longBreak'))}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderRow('Long break every', `${settings.longBreakInterval} sessions`, () => setActivePicker('interval'))}
      </View>

      {/* AUTOMATION */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>AUTOMATION</Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {renderSwitchRow('Auto-start breaks', settings.autoStartBreaks, (val) =>
          updateSettings({ autoStartBreaks: val })
        )}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderSwitchRow('Auto-start focus', settings.autoStartFocus, (val) =>
          updateSettings({ autoStartFocus: val })
        )}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderSwitchRow('Keep screen awake', settings.keepScreenAwake, (val) =>
          updateSettings({ keepScreenAwake: val })
        )}
      </View>

      {/* SOUND & HAPTICS */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SOUND & HAPTICS</Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {renderRow('Alert sound', 'Default Chime')}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderSwitchRow('Haptics', settings.hapticsEnabled, (val) =>
          updateSettings({ hapticsEnabled: val })
        )}
      </View>

      {/* APPEARANCE */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>APPEARANCE</Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {renderRow(
          'Theme',
          themeOptions.find((t) => t.id === settings.themePreset)?.label || 'System',
          () => setActivePicker('theme')
        )}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderRow(
          'Clock style',
          clockStyleOptions.find((c) => c.id === settings.visualClockStyle)?.label || 'Ring',
          () => setActivePicker('clockStyle')
        )}
      </View>

      {/* DATA */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DATA</Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {renderRow('Daily goal', `${settings.dailyGoalSessions} sessions`, () => setActivePicker('goal'))}
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        {renderRow('Reset statistics & history', 'Reset', () => {
          HapticService.buttonPress();
          clearHistory();
        }, true)}
      </View>

      {/* Universal Selection Picker Modal */}
      <Modal visible={activePicker !== null} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)}>
          <View style={[styles.pickerDialog, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
              {activePicker === 'focus' && 'Select Focus Length'}
              {activePicker === 'shortBreak' && 'Select Short Break'}
              {activePicker === 'longBreak' && 'Select Long Break'}
              {activePicker === 'interval' && 'Long Break Frequency'}
              {activePicker === 'theme' && 'Select Theme'}
              {activePicker === 'clockStyle' && 'Select Clock Visualizer'}
              {activePicker === 'goal' && 'Select Daily Goal'}
            </Text>

            {/* Options list */}
            {activePicker === 'focus' &&
              durationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ focusDurationMin: opt });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt} min</Text>
                  {settings.focusDurationMin === opt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'shortBreak' &&
              shortBreakOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ shortBreakDurationMin: opt });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt} min</Text>
                  {settings.shortBreakDurationMin === opt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'longBreak' &&
              longBreakOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ longBreakDurationMin: opt });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt} min</Text>
                  {settings.longBreakDurationMin === opt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'interval' &&
              intervalOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ longBreakInterval: opt });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>Every {opt} focus sessions</Text>
                  {settings.longBreakInterval === opt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'theme' &&
              themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ themePreset: opt.id });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt.label}</Text>
                  {settings.themePreset === opt.id && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'clockStyle' &&
              clockStyleOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ visualClockStyle: opt.id });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt.label}</Text>
                  {settings.visualClockStyle === opt.id && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}

            {activePicker === 'goal' &&
              goalOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateSettings({ dailyGoalSessions: opt });
                    setActivePicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{opt} sessions per day</Text>
                  {settings.dailyGoalSessions === opt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                </TouchableOpacity>
              ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerDialog: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
