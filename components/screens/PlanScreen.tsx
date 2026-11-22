import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Live total time calculation
  const totalMinutes = computeTotalPlanMinutes(plan);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const formattedTotalTime =
    totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins}m`;

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
        {/* SESSIONS SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SESSIONS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderGroupRow(
            'Number of focus sessions',
            plan.sessionCount === 'unlimited' ? 'Unlimited' : `${plan.sessionCount}`,
            () => setActivePicker('sessionCount')
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Focus length',
            `${plan.focusMinutes} min`,
            () => setActivePicker('focusLength')
          )}
        </View>

        {/* BREAKS SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BREAKS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {renderGroupRow(
            'Short break length',
            `${plan.shortBreakMinutes} min`,
            () => setActivePicker('shortBreak')
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Long break length',
            `${plan.longBreakMinutes} min`,
            () => setActivePicker('longBreak')
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Long break after',
            plan.longBreakEvery === 'never' ? 'Never' : `${plan.longBreakEvery} sessions`,
            () => setActivePicker('longEvery')
          )}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          {renderGroupRow(
            'Number of breaks',
            `${plan.breakCount}`,
            () => setActivePicker('breakCount')
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
                    <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>
                      {block.type === 'focus' ? 'Focus' : block.type === 'long' ? 'Long Break' : 'Short Break'}
                    </Text>
                    <Text style={[styles.blockDuration, { color: colors.accentFocus }]}>
                      {block.minutes}m
                    </Text>
                  </View>

                  <View style={styles.blockControls}>
                    {idx > 0 && (
                      <TouchableOpacity
                        onPress={() => handleMoveBlock(idx, 'up')}
                        style={styles.reorderBtn}
                      >
                        <Text style={{ color: colors.textPrimary }}>▲</Text>
                      </TouchableOpacity>
                    )}
                    {idx < plan.customSequence.length - 1 && (
                      <TouchableOpacity
                        onPress={() => handleMoveBlock(idx, 'down')}
                        style={styles.reorderBtn}
                      >
                        <Text style={{ color: colors.textPrimary }}>▼</Text>
                      </TouchableOpacity>
                    )}
                    {plan.customSequence.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCustomBlock(idx)}
                        style={styles.deleteBlockBtn}
                      >
                        <Text style={{ color: colors.danger, fontWeight: '700' }}>✕</Text>
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

        {/* FOOTER: LIVE TOTAL TIME & RESET DEFAULTS */}
        <View style={styles.footerSection}>
          <View style={[styles.totalTimeCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.totalTimeLabel, { color: colors.textSecondary }]}>CYCLE ESTIMATE</Text>
            <Text style={[styles.totalTimeValue, { color: colors.textPrimary }]}>
              {formattedTotalTime} total
            </Text>
            <Text style={[styles.totalTimeDetails, { color: colors.textMuted }]}>
              {plan.sessionCount === 'unlimited' ? 'Continuous loop' : `${plan.sessionCount} focus sessions, ${plan.breakCount} breaks`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.resetDefaultsBtn, { borderColor: colors.surfaceBorder }]}
            onPress={() => setIsResetConfirmOpen(true)}
          >
            <Text style={[styles.resetDefaultsText, { color: colors.danger }]}>
              Reset to defaults (25 / 5 / 15, 4 sessions)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={activePicker !== null} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)}>
          <View style={[styles.pickerDialog, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
              {activePicker === 'sessionCount' && 'Number of Sessions'}
              {activePicker === 'focusLength' && 'Focus Length'}
              {activePicker === 'shortBreak' && 'Short Break Length'}
              {activePicker === 'longBreak' && 'Long Break Length'}
              {activePicker === 'longEvery' && 'Long Break Frequency'}
              {activePicker === 'breakCount' && 'Total Breaks'}
              {activePicker === 'theme' && 'Theme'}
              {activePicker === 'clockStyle' && 'Clock Visualizer'}
            </Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Session Count Options */}
              {activePicker === 'sessionCount' &&
                ([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 'unlimited'] as (number | 'unlimited')[]).map((val) => (
                  <TouchableOpacity
                    key={String(val)}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ sessionCount: val });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                      {val === 'unlimited' ? 'Unlimited' : `${val} sessions`}
                    </Text>
                    {plan.sessionCount === val && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}

              {/* Focus Length Presets */}
              {activePicker === 'focusLength' &&
                [1, 2, 3, 4, 5, 8, 10, 15, 20, 25, 30, 45, 50, 60, 90, 120].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ focusMinutes: mins });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{mins} min</Text>
                    {plan.focusMinutes === mins && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}

              {/* Short Break Length */}
              {activePicker === 'shortBreak' &&
                [1, 2, 3, 4, 5, 8, 10, 15, 20, 30].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ shortBreakMinutes: mins });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{mins} min</Text>
                    {plan.shortBreakMinutes === mins && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}

              {/* Long Break Length */}
              {activePicker === 'longBreak' &&
                [5, 10, 15, 20, 25, 30, 45].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ longBreakMinutes: mins });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{mins} min</Text>
                    {plan.longBreakMinutes === mins && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}

              {/* Long Break Every */}
              {activePicker === 'longEvery' &&
                (['never', 2, 3, 4, 5, 6, 8] as ('never' | number)[]).map((val) => (
                  <TouchableOpacity
                    key={String(val)}
                    style={styles.pickerOption}
                    onPress={() => {
                      updatePlan({ longBreakEvery: val });
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>
                      {val === 'never' ? 'Never' : `After ${val} sessions`}
                    </Text>
                    {plan.longBreakEvery === val && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                  </TouchableOpacity>
                ))}

              {/* Break Count */}
              {activePicker === 'breakCount' &&
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((cnt) => {
                  const max = plan.sessionCount === 'unlimited' ? 12 : plan.sessionCount;
                  if (cnt > max && plan.sessionCount !== 'unlimited') return null;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      style={styles.pickerOption}
                      onPress={() => {
                        updatePlan({ breakCount: cnt });
                        setActivePicker(null);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{cnt} breaks</Text>
                      {plan.breakCount === cnt && <Text style={{ color: colors.accentFocus }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

              {/* Theme */}
              {activePicker === 'theme' &&
                ([
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

              {/* Clock Style */}
              {activePicker === 'clockStyle' &&
                ([
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
          </View>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
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
    borderWidth: 1,
    marginBottom: 8,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockDuration: {
    fontSize: 14,
    fontWeight: '700',
  },
  blockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  deleteBlockBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
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
    borderWidth: 1,
    alignItems: 'center',
  },
  addPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerSection: {
    marginTop: 24,
    gap: 16,
  },
  totalTimeCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  totalTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  totalTimeValue: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 4,
  },
  totalTimeDetails: {
    fontSize: 13,
  },
  resetDefaultsBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetDefaultsText: {
    fontSize: 14,
    fontWeight: '600',
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
