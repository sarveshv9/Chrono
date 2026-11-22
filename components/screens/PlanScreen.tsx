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
import { useTimerStore, computeTotalPlanMinutes, PomodoroBlock, BlockType, ClockStyle } from '@/store/useTimerStore';
import { ThemeColors, ThemePreset } from '@/theme/tokens';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { HapticService } from '@/services/hapticsService';

interface PlanScreenProps {
  colors: ThemeColors;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({ colors }) => {
  const plan = useTimerStore((state) => state.plan);
  const updatePlan = useTimerStore((state) => state.updatePlan);
  const resetPlanToDefaults = useTimerStore((state) => state.resetPlanToDefaults);
  const setCurrentScreen = useTimerStore((state) => state.setCurrentScreen);

  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [customInputVal, setCustomInputVal] = useState<string>('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Live total time calculation
  const totalMinutes = computeTotalPlanMinutes(plan);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const formattedTotalTime =
    totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins}m`;

  const openPicker = (key: string, initialVal: number | string) => {
    HapticService.buttonPress();
    setActivePicker(key);
    setCustomInputVal(String(initialVal));
  };

  const handleApplyCustomInput = () => {
    HapticService.buttonPress();
    const num = parseInt(customInputVal.trim(), 10);
    if (!activePicker) return;

    if (activePicker === 'sessionCount') {
      if (customInputVal.toLowerCase() === 'unlimited') {
        updatePlan({ sessionCount: 'unlimited' });
      } else if (!isNaN(num) && num > 0) {
        updatePlan({ sessionCount: num });
      }
    } else if (activePicker === 'focusLength') {
      if (!isNaN(num) && num > 0) {
        updatePlan({ focusMinutes: num });
      }
    } else if (activePicker === 'shortBreak') {
      if (!isNaN(num) && num > 0) {
        updatePlan({ shortBreakMinutes: num });
      }
    } else if (activePicker === 'longBreak') {
      if (!isNaN(num) && num > 0) {
        updatePlan({ longBreakMinutes: num });
      }
    } else if (activePicker === 'longEvery') {
      if (customInputVal.toLowerCase() === 'never') {
        updatePlan({ longBreakEvery: 'never' });
      } else if (!isNaN(num) && num > 0) {
        updatePlan({ longBreakEvery: num });
      }
    } else if (activePicker === 'breakCount') {
      if (!isNaN(num) && num >= 0) {
        updatePlan({ breakCount: num });
      }
    } else if (activePicker.startsWith('customBlock_')) {
      const idx = parseInt(activePicker.replace('customBlock_', ''), 10);
      if (!isNaN(idx) && !isNaN(num) && num > 0) {
        const updated = [...plan.customSequence];
        if (updated[idx]) {
          updated[idx] = { ...updated[idx], minutes: num };
          updatePlan({ customSequence: updated });
        }
      }
    }

    setActivePicker(null);
  };

  // Custom Sequence Actions
  const handleAddCustomBlock = (type: BlockType) => {
    const defaultMins = type === 'focus' ? plan.focusMinutes : type === 'short' ? plan.shortBreakMinutes : plan.longBreakMinutes;
    const newBlock: PomodoroBlock = {
      id: `custom_${Date.now()}`,
      type,
      minutes: defaultMins,
    };
    updatePlan({
      customSequence: [...plan.customSequence, newBlock],
    });
  };

  const handleDeleteCustomBlock = (index: number) => {
    const updated = plan.customSequence.filter((_, i) => i !== index);
    updatePlan({ customSequence: updated });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const updated = [...plan.customSequence];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    updatePlan({ customSequence: updated });
  };

  const renderGroupRow = (
    label: string,
    value: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        if (onPress) {
          HapticService.buttonPress();
          onPress();
        }
      }}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
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
    <View style={styles.container}>
      {/* Top Header Rail with standard Back Button */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('timer');
          }}
          accessibilityLabel="Back to Timer"
          accessibilityRole="button"
        >
          <Text style={[styles.backIcon, { color: colors.accentFocus }]}>‹</Text>
          <Text style={[styles.backText, { color: colors.accentFocus }]}>Timer</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Plan</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CYCLE PREVIEW HERO CARD */}
        <View style={[styles.heroCycleCard, { backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.heroCycleLabel, { color: colors.textMuted }]}>PLANNED CYCLE</Text>
          <Text style={[styles.heroCycleTime, { color: colors.textPrimary }]}>
            {formattedTotalTime}
          </Text>
          <Text style={[styles.heroCycleSubtitle, { color: colors.textSecondary }]}>
            {plan.sessionCount === 'unlimited' ? 'Continuous loop' : `${plan.sessionCount} focus sessions · ${plan.breakCount} breaks`}
          </Text>
        </View>

        {/* SESSIONS SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SESSIONS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderGroupRow(
            'Number of focus sessions',
            plan.sessionCount === 'unlimited' ? 'Unlimited' : `${plan.sessionCount}`,
            () => openPicker('sessionCount', plan.sessionCount)
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Focus length',
            `${plan.focusMinutes} min`,
            () => openPicker('focusLength', plan.focusMinutes)
          )}
        </View>

        {/* BREAKS SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BREAKS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderGroupRow(
            'Short break length',
            `${plan.shortBreakMinutes} min`,
            () => openPicker('shortBreak', plan.shortBreakMinutes)
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Long break length',
            `${plan.longBreakMinutes} min`,
            () => openPicker('longBreak', plan.longBreakMinutes)
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Long break after',
            plan.longBreakEvery === 'never' ? 'Never' : `${plan.longBreakEvery} sessions`,
            () => openPicker('longEvery', plan.longBreakEvery)
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Number of breaks',
            `${plan.breakCount}`,
            () => openPicker('breakCount', plan.breakCount)
          )}
        </View>

        {/* AUTOMATION SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AUTOMATION</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderSwitchRow('Auto-start next block', plan.autoStartNext, (val) =>
            updatePlan({ autoStartNext: val })
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderSwitchRow('Notify when block ends', plan.notifyOnEnd, (val) =>
            updatePlan({ notifyOnEnd: val })
          )}
        </View>

        {/* CUSTOM SEQUENCE MODE */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CUSTOM SEQUENCE</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderSwitchRow('Enable custom sequence', plan.customSequenceEnabled, (val) =>
            updatePlan({ customSequenceEnabled: val })
          )}

          {plan.customSequenceEnabled && (
            <View style={styles.customSequenceWrapper}>
              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
              <Text style={[styles.sequenceSubhead, { color: colors.textSecondary }]}>
                BLOCKS (IN ORDER OF EXECUTION)
              </Text>

              {plan.customSequence.map((block, idx) => (
                <View
                  key={block.id}
                  style={[styles.blockRow, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
                >
                  <View style={styles.blockInfo}>
                    <Text style={[styles.blockIndex, { color: colors.textMuted }]}>#{idx + 1}</Text>
                    <View style={[
                      styles.typeTag,
                      {
                        backgroundColor:
                          block.type === 'focus'
                            ? colors.accentFocus + '22'
                            : block.type === 'long'
                            ? colors.accentLongBreak + '22'
                            : colors.accentShortBreak + '22',
                      },
                    ]}>
                      <Text style={[
                        styles.typeTagText,
                        {
                          color:
                            block.type === 'focus'
                              ? colors.accentFocus
                              : block.type === 'long'
                              ? colors.accentLongBreak
                              : colors.accentShortBreak,
                        },
                      ]}>
                        {block.type === 'focus' ? 'Focus' : block.type === 'long' ? 'Long' : 'Short'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.blockDurationPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                      onPress={() => openPicker(`customBlock_${idx}`, block.minutes)}
                      accessibilityLabel={`Change duration for block ${idx + 1}, currently ${block.minutes} minutes`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.blockDuration, { color: colors.textPrimary }]}>
                        {block.minutes}m ✎
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.blockControls}>
                    {idx > 0 && (
                      <TouchableOpacity
                        onPress={() => handleMoveBlock(idx, 'up')}
                        style={[styles.reorderBtn, { borderColor: colors.surfaceBorder }]}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 12 }}>▲</Text>
                      </TouchableOpacity>
                    )}
                    {idx < plan.customSequence.length - 1 && (
                      <TouchableOpacity
                        onPress={() => handleMoveBlock(idx, 'down')}
                        style={[styles.reorderBtn, { borderColor: colors.surfaceBorder }]}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 12 }}>▼</Text>
                      </TouchableOpacity>
                    )}
                    {plan.customSequence.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCustomBlock(idx)}
                        style={[styles.deleteBlockBtn, { borderColor: colors.surfaceBorder }]}
                      >
                        <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.addBlockRow}>
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => handleAddCustomBlock('focus')}
                >
                  <Text style={[styles.addPillText, { color: colors.accentFocus }]}>+ Focus</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => handleAddCustomBlock('short')}
                >
                  <Text style={[styles.addPillText, { color: colors.accentShortBreak }]}>+ Short</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => handleAddCustomBlock('long')}
                >
                  <Text style={[styles.addPillText, { color: colors.accentLongBreak }]}>+ Long</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* APPEARANCE SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderGroupRow(
            'Theme',
            plan.themePreset === 'system' ? 'Follow System' : plan.themePreset.toUpperCase(),
            () => setActivePicker('theme')
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Clock style',
            plan.visualClockStyle.toUpperCase(),
            () => setActivePicker('clockStyle')
          )}
        </View>

        {/* QUIET RESET ACTION */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.resetTextBtn}
            onPress={() => setIsResetConfirmOpen(true)}
          >
            <Text style={[styles.resetTextBtnLabel, { color: colors.textMuted }]}>
              Reset Plan to Standard Defaults
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={activePicker !== null} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActivePicker(null)} />
          <View style={[styles.pickerDialog, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.pickerHeaderRow}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                {activePicker === 'sessionCount' && 'Number of Sessions'}
                {activePicker === 'focusLength' && 'Focus Length'}
                {activePicker === 'shortBreak' && 'Short Break Length'}
                {activePicker === 'longBreak' && 'Long Break Length'}
                {activePicker === 'longEvery' && 'Long Break Frequency'}
                {activePicker === 'breakCount' && 'Total Breaks'}
                {activePicker?.startsWith('customBlock_') && 'Block Duration'}
                {activePicker === 'theme' && 'Theme'}
                {activePicker === 'clockStyle' && 'Clock Visualizer'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)} style={styles.pickerCloseBtn}>
                <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Categorical Pickers: Theme & Clock Style */}
            {activePicker === 'theme' && (
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {([
                  { id: 'system', label: 'Follow System' },
                  { id: 'oled', label: 'OLED Obsidian' },
                  { id: 'papyrus', label: 'Warm Papyrus' },
                  { id: 'neon', label: 'Cyber Neon' },
                  { id: 'matcha', label: 'Matcha Calm' },
                ] as { id: ThemePreset; label: string }[]).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ themePreset: t.id });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{t.label}</Text>
                    {plan.themePreset === t.id && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {activePicker === 'clockStyle' && (
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {([
                  { id: 'ring', label: 'Circular Ring' },
                  { id: 'sandglass', label: 'Digital Minimal' },
                  { id: 'flip', label: 'Retro Flip Clock' },
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
                    {plan.visualClockStyle === c.id && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Any Numerical Picker: Custom Input + Presets */}
            {activePicker !== null && activePicker !== 'theme' && activePicker !== 'clockStyle' && (
              <View>
                {/* Compact Centered Number Input */}
                <View style={styles.customInputCenterRow}>
                  <View style={[styles.customNumberBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <TextInput
                      style={[styles.customTextInput, { color: colors.textPrimary }]}
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
                  <Text style={[styles.customInputUnit, { color: colors.textSecondary }]}>
                    {activePicker === 'focusLength' || activePicker === 'shortBreak' || activePicker === 'longBreak' || activePicker?.startsWith('customBlock_')
                      ? 'min'
                      : activePicker === 'sessionCount' || activePicker === 'longEvery'
                      ? 'sessions'
                      : 'breaks'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.customInputApplyBtn, { backgroundColor: colors.accentFocus }]}
                    onPress={handleApplyCustomInput}
                  >
                    <Text style={styles.customInputApplyText}>Set</Text>
                  </TouchableOpacity>
                </View>

                {/* Special Shortcut Buttons */}
                {activePicker === 'sessionCount' && (
                  <TouchableOpacity
                    style={[styles.specialToggleBtn, { borderColor: colors.surfaceBorder, backgroundColor: plan.sessionCount === 'unlimited' ? colors.surface : 'transparent' }]}
                    onPress={() => {
                      updatePlan({ sessionCount: 'unlimited' });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={{ color: colors.accentFocus, fontWeight: '700' }}>
                      Set to Unlimited Sessions {plan.sessionCount === 'unlimited' ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                {activePicker === 'longEvery' && (
                  <TouchableOpacity
                    style={[styles.specialToggleBtn, { borderColor: colors.surfaceBorder, backgroundColor: plan.longBreakEvery === 'never' ? colors.surface : 'transparent' }]}
                    onPress={() => {
                      updatePlan({ longBreakEvery: 'never' });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={{ color: colors.accentFocus, fontWeight: '700' }}>
                      Set to Never (No Long Break) {plan.longBreakEvery === 'never' ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Quick Presets Grid */}
                <Text style={[styles.presetsSubhead, { color: colors.textSecondary }]}>
                  OR QUICK PRESETS:
                </Text>

                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.presetsWrap}>
                    {(activePicker === 'focusLength' || activePicker?.startsWith('customBlock_')
                      ? [1, 2, 3, 4, 5, 8, 10, 15, 20, 25, 30, 45, 50, 60, 90, 120]
                      : activePicker === 'shortBreak'
                      ? [1, 2, 3, 4, 5, 8, 10, 15, 20, 30]
                      : activePicker === 'longBreak'
                      ? [5, 10, 15, 20, 25, 30, 45, 60]
                      : activePicker === 'sessionCount'
                      ? [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20]
                      : activePicker === 'longEvery'
                      ? [2, 3, 4, 5, 6, 8]
                      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12]
                    ).map((preset) => {
                      const isCurrent =
                        (activePicker === 'focusLength' && plan.focusMinutes === preset) ||
                        (activePicker === 'shortBreak' && plan.shortBreakMinutes === preset) ||
                        (activePicker === 'longBreak' && plan.longBreakMinutes === preset) ||
                        (activePicker === 'sessionCount' && plan.sessionCount === preset) ||
                        (activePicker === 'longEvery' && plan.longBreakEvery === preset) ||
                        (activePicker === 'breakCount' && plan.breakCount === preset);

                      return (
                        <TouchableOpacity
                          key={String(preset)}
                          style={[
                            styles.presetChip,
                            {
                              borderColor: isCurrent ? colors.accentFocus : colors.surfaceBorder,
                              backgroundColor: isCurrent ? colors.surface : 'transparent',
                            },
                          ]}
                          onPress={() => {
                            if (activePicker === 'sessionCount') updatePlan({ sessionCount: preset });
                            else if (activePicker === 'focusLength') updatePlan({ focusMinutes: preset });
                            else if (activePicker === 'shortBreak') updatePlan({ shortBreakMinutes: preset });
                            else if (activePicker === 'longBreak') updatePlan({ longBreakMinutes: preset });
                            else if (activePicker === 'longEvery') updatePlan({ longBreakEvery: preset });
                            else if (activePicker === 'breakCount') updatePlan({ breakCount: preset });
                            else if (activePicker?.startsWith('customBlock_')) {
                              const idx = parseInt(activePicker.replace('customBlock_', ''), 10);
                              const updated = [...plan.customSequence];
                              if (updated[idx]) {
                                updated[idx] = { ...updated[idx], minutes: preset };
                                updatePlan({ customSequence: updated });
                              }
                            }
                            setActivePicker(null);
                          }}
                        >
                          <Text style={[styles.presetChipText, { color: isCurrent ? colors.accentFocus : colors.textPrimary }]}>
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation to reset plan */}
      <ConfirmActionModal
        visible={isResetConfirmOpen}
        title="Reset Plan to Defaults?"
        message="This will restore the plan to 25m Focus, 5m Short Break, 15m Long Break, and 4 Sessions."
        confirmText="Reset Plan"
        isDestructive={true}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          resetPlanToDefaults();
        }}
        colors={colors}
      />
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
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: 10,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
    marginRight: 4,
    marginTop: -2,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  heroCycleCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 10,
  },
  heroCycleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroCycleTime: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  heroCycleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
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
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  customSequenceWrapper: {
    padding: 16,
  },
  sequenceSubhead: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginVertical: 10,
  },
  blockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  blockDuration: {
    fontSize: 13,
    fontWeight: '700',
  },
  blockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteBlockBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addBlockRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  addPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  addPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  resetTextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetTextBtnLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignSelf: 'center',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerCloseBtn: {
    padding: 4,
    minHeight: 36,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  blockDurationPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  customInputCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  customNumberBox: {
    width: 80,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTextInput: {
    width: '100%',
    height: '100%',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
  },
  customInputUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  customInputApplyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customInputApplyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  specialToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  presetsSubhead: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
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
