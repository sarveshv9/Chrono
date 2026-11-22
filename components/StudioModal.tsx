import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { THEMES } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface StudioModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({ visible, onClose }) => {
  const settings = useTimerStore((state) => state.settings);
  const stats = useTimerStore((state) => state.stats);
  const updateSettings = useTimerStore((state) => state.updateSettings);

  const theme = THEMES[settings.themePreset];
  const colors = theme.colors;

  const [tagInput, setTagInput] = useState(settings.activeTag);

  const tags = ['Deep Work', 'Coding', 'Study', 'Writing', 'Reading', 'Design'];

  const renderStepper = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onValueChange: (val: number) => void
  ) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.cardLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            if (value > min) onValueChange(value - step);
          }}
        >
          <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>-</Text>
        </TouchableOpacity>

        <Text style={[styles.stepperValue, { color: colors.accentActive }]}>
          {value} <Text style={{ fontSize: 14, color: colors.textSecondary }}>min</Text>
        </Text>

        <TouchableOpacity
          style={[styles.stepperBtn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            if (value < max) onValueChange(value + step);
          }}
        >
          <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Focus Studio</Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.accentFocus }]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Save & Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Lifetime Telemetry */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>LIFETIME FOCUS STATS</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.accentActive }]}>
                {stats.totalFocusMinutes}
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Total Minutes</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.accentActive }]}>
                {stats.completedSessions}
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.accentActive }]}>
                {stats.streakDays}🔥
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
          </View>

          {/* Durations Configuration */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CUSTOM DURATIONS</Text>
          {renderStepper('Focus Duration', settings.focusDurationMin, 1, 120, 5, (val) =>
            updateSettings({ focusDurationMin: val })
          )}
          {renderStepper('Short Break Duration', settings.shortBreakDurationMin, 1, 30, 1, (val) =>
            updateSettings({ shortBreakDurationMin: val })
          )}
          {renderStepper('Long Break Duration', settings.longBreakDurationMin, 1, 60, 5, (val) =>
            updateSettings({ longBreakDurationMin: val })
          )}

          {/* Long Break Interval */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.cardLabel, { color: colors.textPrimary }]}>Long Break Interval</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Every {settings.longBreakInterval} completed focus sessions
            </Text>
            <View style={styles.pillsRow}>
              {[2, 3, 4, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor:
                        settings.longBreakInterval === num ? colors.accentFocus : colors.cardBg,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => {
                    HapticService.buttonPress();
                    updateSettings({ longBreakInterval: num });
                  }}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      { color: settings.longBreakInterval === num ? '#FFF' : colors.textPrimary },
                    ]}
                  >
                    {num} cycles
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Tag / Project */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PROJECT & TAG</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[
                styles.textInput,
                { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.cardBg },
              ]}
              value={tagInput}
              onChangeText={(text) => {
                setTagInput(text);
                updateSettings({ activeTag: text });
              }}
              placeholder="Custom tag name..."
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.pillsRow}>
              {tags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: settings.activeTag === t ? colors.accentFocus : colors.cardBg,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => {
                    HapticService.buttonPress();
                    setTagInput(t);
                    updateSettings({ activeTag: t });
                  }}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      { color: settings.activeTag === t ? '#FFF' : colors.textPrimary },
                    ]}
                  >
                    #{t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Automation & Sensory Toggles */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>AUTOMATION & SENSORY</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Auto-start Breaks</Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  Automatically begin break when focus ends
                </Text>
              </View>
              <Switch
                value={settings.autoStartBreaks}
                onValueChange={(val) => {
                  HapticService.buttonPress();
                  updateSettings({ autoStartBreaks: val });
                }}
                thumbColor={settings.autoStartBreaks ? colors.accentFocus : '#888'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Auto-start Focus</Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  Automatically start next session when break ends
                </Text>
              </View>
              <Switch
                value={settings.autoStartFocus}
                onValueChange={(val) => {
                  HapticService.buttonPress();
                  updateSettings({ autoStartFocus: val });
                }}
                thumbColor={settings.autoStartFocus ? colors.accentFocus : '#888'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Haptic Feedback</Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  Tactile vibrations on button taps and transitions
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(val) => {
                  HapticService.buttonPress();
                  updateSettings({ hapticsEnabled: val });
                }}
                thumbColor={settings.hapticsEnabled ? colors.accentFocus : '#888'}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
