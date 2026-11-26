import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useTimerStore,
  computeTotalPlanMinutes,
  buildSequence,
  PomodoroBlock,
  BlockType,
  ClockStyle,
} from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';
import { ReorderList } from '@/components/ui/reorder-list';

const ROW_HEIGHT = 48;
const ROW_MARGIN = 8;

interface PlanScreenProps {
  colors: ThemeColors;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({ colors }) => {
  const plan = useTimerStore((state) => state.plan);
  const updatePlan = useTimerStore((state) => state.updatePlan);
  const setCurrentScreen = useTimerStore((state) => state.setCurrentScreen);

  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [customInputVal, setCustomInputVal] = useState<string>('');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Active sequence and metrics
  const activeSequence = buildSequence(plan);
  const totalMinutes = computeTotalPlanMinutes(plan);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const formattedTotalTime =
    totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins}m`;

  const focusCount = activeSequence.filter((b) => b.type === 'focus').length;
  const breakCount = activeSequence.filter((b) => b.type !== 'focus').length;

  const openPicker = (key: string, initialVal: number | string) => {
    HapticService.buttonPress();
    setActivePicker(key);
    setCustomInputVal(String(initialVal));
  };

  const handleApplyCustomInput = () => {
    HapticService.buttonPress();
    const num = parseInt(customInputVal.trim(), 10);
    if (!activePicker) return;

    if (activePicker === 'focusSessions') {
      if (customInputVal.toLowerCase() === 'unlimited') {
        updatePlan({ sessionCount: 'unlimited', customSequenceEnabled: false });
      } else if (!isNaN(num) && num > 0) {
        updatePlan({ sessionCount: Math.min(50, num), customSequenceEnabled: false });
      }
    } else if (activePicker === 'focusTime') {
      if (!isNaN(num) && num > 0) {
        updatePlan({ focusMinutes: Math.min(180, num), customSequenceEnabled: false });
      }
    } else if (activePicker === 'breakCount') {
      if (!isNaN(num) && num >= 0) {
        updatePlan({ breakCount: Math.min(50, num), customSequenceEnabled: false });
      }
    } else if (activePicker === 'breakTime') {
      if (!isNaN(num) && num > 0) {
        updatePlan({ shortBreakMinutes: Math.min(180, num), customSequenceEnabled: false });
      }
    } else if (activePicker.startsWith('block_')) {
      const idx = parseInt(activePicker.replace('block_', ''), 10);
      if (!isNaN(idx) && !isNaN(num) && num > 0) {
        const updated = [...activeSequence];
        if (updated[idx]) {
          updated[idx] = { ...updated[idx], minutes: Math.min(180, num) };
          updatePlan({ customSequenceEnabled: true, customSequence: updated });
        }
      }
    }

    setActivePicker(null);
  };

  const handleAddBlockToOverview = (type: BlockType) => {
    HapticService.buttonPress();
    const defaultMins = type === 'focus' ? plan.focusMinutes : plan.shortBreakMinutes;
    const newBlock: PomodoroBlock = {
      id: `custom_${Date.now()}`,
      type,
      minutes: defaultMins,
    };
    updatePlan({
      customSequenceEnabled: true,
      customSequence: [...activeSequence, newBlock],
    });
  };

  const handleDeleteBlock = (index: number) => {
    HapticService.buttonPress();
    const updated = activeSequence.filter((_, i) => i !== index);
    updatePlan({
      customSequenceEnabled: true,
      customSequence: updated,
    });
  };

  const handleReorderBlocks = (newBlocks: PomodoroBlock[]) => {
    updatePlan({
      customSequenceEnabled: true,
      customSequence: newBlocks,
    });
  };

  const handleResetToStandard = () => {
    HapticService.buttonPress();
    updatePlan({ customSequenceEnabled: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Clean Monochrome Header */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('timer');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Timer"
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>‹</Text>
          <Text style={[styles.backLabel, { color: colors.textPrimary }]}>Timer</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('timer');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.doneLabel, { color: colors.textPrimary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* 1. FOCUS SESSION CONTAINER */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FOCUS SESSION</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => openPicker('focusSessions', plan.sessionCount)}
            accessibilityRole="button"
            accessibilityLabel={`Number of focus sessions: ${plan.sessionCount}`}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Number of focus sessions</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                {plan.sessionCount === 'unlimited' ? 'Unlimited' : `${plan.sessionCount}`}
              </Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => openPicker('focusTime', plan.focusMinutes)}
            accessibilityRole="button"
            accessibilityLabel={`Focus time: ${plan.focusMinutes} minutes`}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Time</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                {plan.focusMinutes} min
              </Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. BREAK CONTAINER */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BREAK</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => openPicker('breakCount', plan.breakCount)}
            accessibilityRole="button"
            accessibilityLabel={`Number of breaks: ${plan.breakCount}`}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Number of breaks</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                {plan.breakCount}
              </Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => openPicker('breakTime', plan.shortBreakMinutes)}
            accessibilityRole="button"
            accessibilityLabel={`Break time: ${plan.shortBreakMinutes} minutes`}
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Time</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                {plan.shortBreakMinutes} min
              </Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. OVERVIEW CONTAINER (REORDERABLE LIST) */}
        <View style={styles.overviewHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>OVERVIEW</Text>
          {plan.customSequenceEnabled && (
            <TouchableOpacity onPress={handleResetToStandard}>
              <Text style={[styles.resetLink, { color: colors.textMuted }]}>Reset to standard</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, padding: 16, overflow: 'visible' }]}>
          {/* Summary Row */}
          <View style={styles.overviewSummaryRow}>
            <View>
              <Text style={[styles.overviewTotalTime, { color: colors.textPrimary }]}>
                {formattedTotalTime}
              </Text>
              <Text style={[styles.overviewSubtitle, { color: colors.textMuted }]}>
                {focusCount} Focus · {breakCount} Breaks
              </Text>
            </View>
            <View style={[styles.modeBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.modeBadgeText, { color: colors.textMuted }]}>
                {plan.customSequenceEnabled ? 'CUSTOM' : 'STANDARD'}
              </Text>
            </View>
          </View>

          {/* ReorderList component */}
          <ReorderList
            items={activeSequence}
            getId={(b) => b.id}
            getLabel={(b) => `${b.type === 'focus' ? 'Focus' : 'Break'} session, ${b.minutes} minutes`}
            onReorder={handleReorderBlocks}
            setScrollEnabled={setScrollEnabled}
            itemHeight={ROW_HEIGHT}
            itemMargin={ROW_MARGIN}
            colors={{
              surface: colors.background,
              surfaceElevated: colors.surfaceElevated,
              surfaceBorder: colors.surfaceBorder,
              textPrimary: colors.textPrimary,
              textMuted: colors.textMuted,
            }}
            onItemTap={(block, index, isRightEdge) => {
              if (isRightEdge && activeSequence.length > 1) {
                handleDeleteBlock(index);
              } else {
                openPicker(`block_${index}`, block.minutes);
              }
            }}
          >
            {(block, isGrabbed) => {
              const isFocus = block.type === 'focus';
              const blockIndex = activeSequence.findIndex((b) => b.id === block.id);
              const badgeColor = isFocus ? colors.accentFocus : colors.accentShortBreak;
              return (
                <View style={styles.blockInnerRow}>
                  <Text style={[styles.blockIndexText, { color: isGrabbed ? colors.textPrimary : colors.textMuted }]}>
                    #{blockIndex + 1}
                  </Text>

                  <View
                    style={[
                      styles.typeBadge,
                      {
                        borderColor: isGrabbed ? `${badgeColor}66` : `${badgeColor}38`,
                        backgroundColor: isGrabbed ? `${badgeColor}26` : `${badgeColor}14`,
                        shadowColor: badgeColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isGrabbed ? 0.45 : 0.28,
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    ]}
                  >
                    <View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: badgeColor,
                          opacity: isGrabbed ? 0.12 : 0.06,
                        },
                      ]}
                    />
                    <Text style={[styles.typeBadgeText, { color: colors.textPrimary }]}>
                      {isFocus ? 'Focus' : 'Break'}
                    </Text>
                  </View>

                  <View style={[styles.durationPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.durationText, { color: colors.textPrimary }]}>
                      {block.minutes}m ✎
                    </Text>
                  </View>

                  <View style={{ flex: 1 }} />

                  {activeSequence.length > 1 && !isGrabbed && (
                    <View style={[styles.deleteButton, { borderColor: colors.surfaceBorder }]}>
                      <Text style={[styles.deleteButtonText, { color: colors.textMuted }]}>✕</Text>
                    </View>
                  )}
                </View>
              );
            }}
          </ReorderList>

          {/* Add Blocks Row */}
          <View style={styles.addButtonsRow}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: `${colors.accentFocus}33`,
                  backgroundColor: `${colors.accentFocus}0E`,
                },
              ]}
              onPress={() => handleAddBlockToOverview('focus')}
              accessibilityRole="button"
              accessibilityLabel="Add focus session"
            >
              <Text style={[styles.addButtonText, { color: colors.textPrimary }]}>+ Add Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: `${colors.accentShortBreak}33`,
                  backgroundColor: `${colors.accentShortBreak}0E`,
                },
              ]}
              onPress={() => handleAddBlockToOverview('short')}
              accessibilityRole="button"
              accessibilityLabel="Add break"
            >
              <Text style={[styles.addButtonText, { color: colors.textPrimary }]}>+ Add Break</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. PREFERENCES (MINIMAL & MONOCHROME) */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Auto-start next stage</Text>
            <Switch
              value={plan.autoStartNext}
              onValueChange={(val) => {
                HapticService.buttonPress();
                updatePlan({ autoStartNext: val });
              }}
              trackColor={{ false: colors.surfaceBorder, true: colors.textPrimary }}
              thumbColor={Platform.OS === 'android' ? colors.background : undefined}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.cardRow}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Stage completion alerts</Text>
            <Switch
              value={plan.notifyOnEnd}
              onValueChange={(val) => {
                HapticService.buttonPress();
                updatePlan({ notifyOnEnd: val });
              }}
              trackColor={{ false: colors.surfaceBorder, true: colors.textPrimary }}
              thumbColor={Platform.OS === 'android' ? colors.background : undefined}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.cardRow}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark mode</Text>
            <Switch
              value={plan.themePreset === 'dark'}
              onValueChange={(isDark) => {
                HapticService.buttonPress();
                updatePlan({ themePreset: isDark ? 'dark' : 'light' });
              }}
              trackColor={{ false: colors.surfaceBorder, true: colors.textPrimary }}
              thumbColor={Platform.OS === 'android' ? colors.background : undefined}
              accessibilityLabel="Toggle dark mode"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setActivePicker('clockStyle')}
            accessibilityRole="button"
          >
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Clock style</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                {plan.visualClockStyle === 'ring'
                  ? 'Circular Ring'
                  : plan.visualClockStyle === 'sandglass'
                  ? 'Digital Minimal'
                  : plan.visualClockStyle === 'flip'
                  ? 'Retro Flip'
                  : 'Zen Breathing'}
              </Text>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Clean Monochrome Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
          <View style={[styles.dialogCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
                {activePicker === 'focusSessions' && 'Number of Focus Sessions'}
                {activePicker === 'focusTime' && 'Focus Duration'}
                {activePicker === 'breakCount' && 'Number of Breaks'}
                {activePicker === 'breakTime' && 'Break Duration'}
                {activePicker?.startsWith('block_') && 'Block Duration'}
                {activePicker === 'clockStyle' && 'Clock Style'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)} style={styles.dialogCloseBtn}>
                <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* CLOCK STYLE PICKER */}
            {activePicker === 'clockStyle' && (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {([
                  { id: 'ring', label: 'Circular Ring' },
                  { id: 'sandglass', label: 'Digital Minimal' },
                  { id: 'flip', label: 'Retro Flip' },
                  { id: 'breathing', label: 'Zen Breathing' },
                ] as { id: ClockStyle; label: string }[]).map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ visualClockStyle: c.id });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{c.label}</Text>
                    {plan.visualClockStyle === c.id && (
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* NUMERICAL PICKER */}
            {activePicker !== null && activePicker !== 'clockStyle' && (
              <View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={customInputVal}
                      onChangeText={setCustomInputVal}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="done"
                      onSubmitEditing={handleApplyCustomInput}
                      autoFocus={true}
                      maxLength={4}
                      textAlign="center"
                    />
                  </View>
                  <Text style={[styles.unitText, { color: colors.textMuted }]}>
                    {activePicker === 'focusTime' || activePicker === 'breakTime' || activePicker?.startsWith('block_')
                      ? 'min'
                      : activePicker === 'focusSessions'
                      ? 'sessions'
                      : 'breaks'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: colors.textPrimary }]}
                    onPress={handleApplyCustomInput}
                  >
                    <Text style={[styles.applyButtonText, { color: colors.background }]}>Set</Text>
                  </TouchableOpacity>
                </View>

                {/* Unlimited Option for Focus Sessions */}
                {activePicker === 'focusSessions' && (
                  <TouchableOpacity
                    style={[
                      styles.unlimitedButton,
                      {
                        borderColor: colors.surfaceBorder,
                        backgroundColor: plan.sessionCount === 'unlimited' ? colors.surfaceElevated : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      updatePlan({ sessionCount: 'unlimited', customSequenceEnabled: false });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                      Set to Unlimited Sessions {plan.sessionCount === 'unlimited' ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Presets */}
                <Text style={[styles.presetsHeader, { color: colors.textMuted }]}>PRESETS</Text>
                <View style={styles.presetsWrap}>
                  {(activePicker === 'focusTime' || activePicker?.startsWith('block_')
                    ? [15, 20, 25, 30, 45, 50, 60, 90]
                    : activePicker === 'breakTime'
                    ? [3, 5, 8, 10, 15, 20]
                    : activePicker === 'focusSessions'
                    ? [1, 2, 3, 4, 5, 6, 8, 10]
                    : [0, 1, 2, 3, 4, 5, 6, 8]
                  ).map((preset) => {
                    return (
                      <TouchableOpacity
                        key={String(preset)}
                        style={[styles.presetChip, { borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
                        onPress={() => {
                          HapticService.buttonPress();
                          if (activePicker === 'focusSessions') updatePlan({ sessionCount: preset, customSequenceEnabled: false });
                          else if (activePicker === 'focusTime') updatePlan({ focusMinutes: preset, customSequenceEnabled: false });
                          else if (activePicker === 'breakTime') updatePlan({ shortBreakMinutes: preset, customSequenceEnabled: false });
                          else if (activePicker === 'breakCount') updatePlan({ breakCount: preset, customSequenceEnabled: false });
                          else if (activePicker?.startsWith('block_')) {
                            const idx = parseInt(activePicker.replace('block_', ''), 10);
                            const updated = [...activeSequence];
                            if (updated[idx]) {
                              updated[idx] = { ...updated[idx], minutes: preset };
                              updatePlan({ customSequenceEnabled: true, customSequence: updated });
                            }
                          }
                          setActivePicker(null);
                        }}
                      >
                        <Text style={[styles.presetChipText, { color: colors.textPrimary }]}>
                          {preset}
                          {activePicker === 'focusTime' || activePicker === 'breakTime' || activePicker?.startsWith('block_')
                            ? 'm'
                            : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    marginRight: 4,
    marginTop: -2,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  doneButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  doneLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  resetLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  overviewSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewTotalTime: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  overviewSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  blockInnerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockIndexText: {
    fontSize: 12,
    fontWeight: '700',
    width: 26,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  durationPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    alignSelf: 'center',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogCloseBtn: {
    padding: 4,
    minHeight: 28,
    minWidth: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputBox: {
    width: 76,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    width: '100%',
    height: '100%',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unlimitedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  presetsHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
