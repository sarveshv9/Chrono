import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import Svg, { Path, Circle } from 'react-native-svg';
import { CircularRingClock } from '@/components/clocks/CircularRingClock';
import { DigitalClock } from '@/components/clocks/DigitalClock';
import { FlipClock } from '@/components/clocks/FlipClock';
import { ZenBreathingClock } from '@/components/clocks/ZenBreathingClock';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { HapticService } from '@/services/hapticsService';

const SettingsIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

interface TimerScreenProps {
  colors: ThemeColors;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ colors }) => {
  const {
    status,
    activeBlocks,
    currentBlockIndex,
    remainingMs,
    totalDurationMs,
    plan,
    start,
    pause,
    resume,
    reset,
    skip,
    setCurrentBlockMinutes,
    setCurrentScreen,
  } = useTimerStore();

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    action: () => {},
  });

  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [durationInputVal, setDurationInputVal] = useState('');

  const currentBlock = activeBlocks[currentBlockIndex] || activeBlocks[0] || {
    id: '1',
    type: 'focus',
    minutes: 25,
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  // Calculate session number in focus blocks
  const focusBlocks = activeBlocks.filter((b) => b.type === 'focus');
  const currentFocusIndex = activeBlocks
    .slice(0, currentBlockIndex + 1)
    .filter((b) => b.type === 'focus').length;

  const totalFocusCount = plan.sessionCount === 'unlimited' ? '∞' : `${focusBlocks.length}`;

  const getStageHeader = () => {
    if (isCompleted) {
      return 'Cycle Completed';
    } else if (currentBlock.type === 'focus') {
      return `Session ${currentFocusIndex || 1} of ${totalFocusCount}`;
    } else if (currentBlock.type === 'long') {
      return 'Long Break';
    } else {
      return 'Short Break';
    }
  };

  const stageAccentColor =
    isCompleted
      ? colors.accentShortBreak
      : currentBlock.type === 'focus'
      ? colors.accentFocus
      : currentBlock.type === 'long'
      ? colors.accentLongBreak
      : colors.accentShortBreak;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const stageTypeLabel =
    currentBlock.type === 'focus'
      ? 'FOCUS'
      : currentBlock.type === 'long'
      ? 'LONG BREAK'
      : 'SHORT BREAK';

  const renderProgressDots = () => {
    if (plan.sessionCount === 'unlimited') return null;

    const displayBlocks = activeBlocks.slice(0, 16);

    return (
      <View style={styles.dotsRow}>
        {displayBlocks.map((block, idx) => {
          const isCompleted = idx < currentBlockIndex;
          const isCurrent = idx === currentBlockIndex;
          const blockColor =
            block.type === 'focus'
              ? colors.accentFocus
              : block.type === 'long'
              ? colors.accentLongBreak
              : colors.accentShortBreak;

          const pillWidth = isCurrent ? 22 : isCompleted ? (block.type === 'focus' ? 14 : 8) : 6;
          const pillColor = isCurrent ? stageAccentColor : isCompleted ? blockColor : colors.progressTrack;

          return (
            <View
              key={block.id || idx}
              style={[
                styles.dotPill,
                {
                  width: pillWidth,
                  backgroundColor: pillColor,
                  opacity: isCompleted || isCurrent ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const handleSkipPress = () => {
    if (isRunning) {
      setConfirmModal({
        visible: true,
        title: 'Skip to Next Block?',
        message: 'This will end the current block early and advance to the next scheduled stage.',
        action: skip,
      });
    } else {
      HapticService.buttonPress();
      skip();
    }
  };

  const handleResetPress = () => {
    if (isRunning) {
      setConfirmModal({
        visible: true,
        title: 'Reset Current Block?',
        message: 'This will reset the clock back to the full scheduled duration for this block.',
        action: reset,
      });
    } else {
      HapticService.buttonPress();
      reset();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Rail: Brand & Settings Icon */}
      <View style={styles.header}>
        <Text style={[styles.brandTitle, { color: colors.textMuted }]}>CHRONOCRAFT</Text>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('plan');
          }}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <SettingsIcon size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Center Clock Canvas */}
      <View
        style={styles.clockSection}
        accessible
        accessibilityLabel={`Timer, ${minutes} minutes ${seconds} seconds, ${isRunning ? 'running' : isPaused ? 'paused' : 'idle'}`}
      >
        <View style={[styles.stagePill, { backgroundColor: colors.glassBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.stagePillText, { color: stageAccentColor }]}>
            {getStageHeader()}
          </Text>
        </View>

        {isCompleted ? (
          <View style={styles.completedCard}>
            <View style={[styles.trophyIconCircle, { backgroundColor: colors.accentShortBreak + '20', borderColor: colors.accentShortBreak }]}>
              <Text style={{ fontSize: 44 }}>🏆</Text>
            </View>
            <Text style={[styles.completedHeading, { color: colors.textPrimary }]}>
              Cycle Completed!
            </Text>
            <Text style={[styles.completedSubtext, { color: colors.textSecondary }]}>
              All {focusBlocks.length} focus sessions and breaks are done.
            </Text>
            <View style={[styles.completedSummaryPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.completedSummaryText, { color: colors.accentShortBreak }]}>
                ✓ {plan.sessionCount === 'unlimited' ? 'Loop Finished' : `${plan.focusMinutes * focusBlocks.length}m focused`}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={isRunning ? 1 : 0.75}
            onPress={() => {
              if (!isRunning) {
                HapticService.buttonPress();
                setDurationInputVal(String(currentBlock.minutes));
                setDurationModalOpen(true);
              }
            }}
            style={styles.clockWrapper}
          >
            {plan.visualClockStyle === 'ring' && (
              <CircularRingClock
                remainingMs={remainingMs}
                totalDurationMs={totalDurationMs}
                colors={colors}
                stageColor={stageAccentColor}
              />
            )}
            {plan.visualClockStyle === 'sandglass' && (
              <DigitalClock
                remainingMs={remainingMs}
                totalDurationMs={totalDurationMs}
                colors={colors}
                stageColor={stageAccentColor}
              />
            )}
            {plan.visualClockStyle === 'flip' && (
              <FlipClock remainingMs={remainingMs} colors={colors} />
            )}
            {plan.visualClockStyle === 'breathing' && (
              <ZenBreathingClock
                remainingMs={remainingMs}
                colors={colors}
                stageColor={stageAccentColor}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Plan Progress Oblong Indicators */}
        {renderProgressDots()}

        {/* Duration Badge (when idle) */}
        {!isRunning && !isPaused && !isCompleted && (
          <TouchableOpacity
            style={[styles.quickDurationBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            onPress={() => {
              HapticService.buttonPress();
              setDurationInputVal(String(currentBlock.minutes));
              setDurationModalOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Change duration for this ${stageTypeLabel.toLowerCase()} session, currently ${currentBlock.minutes} minutes`}
          >
            <Text style={[styles.quickDurationText, { color: colors.textSecondary }]}>
              {currentBlock.minutes} MIN {stageTypeLabel} <Text style={{ color: stageAccentColor }}>▾</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Symmetrical Floating Action Pod */}
      <View style={styles.actionPod}>
        {/* Reset Disc Button */}
        <TouchableOpacity
          style={[styles.discBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
          onPress={handleResetPress}
          accessibilityRole="button"
          accessibilityLabel="Reset current session"
        >
          <Text style={[styles.discBtnIcon, { color: colors.textSecondary }]}>↺</Text>
        </TouchableOpacity>

        {/* Hero Capsule Start/Pause/New Cycle Button */}
        <TouchableOpacity
          style={[styles.heroPillBtn, { backgroundColor: stageAccentColor }]}
          onPress={() => {
            HapticService.buttonPress();
            if (isCompleted) {
              reset();
              setTimeout(() => start(), 100);
            } else if (isRunning) {
              pause();
            } else if (isPaused) {
              resume();
            } else {
              start();
            }
          }}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={isCompleted ? 'Start new cycle' : isRunning ? 'Pause timer' : isPaused ? 'Resume timer' : 'Start timer'}
        >
          <Text style={styles.heroPillText}>
            {isCompleted ? 'NEW CYCLE' : isRunning ? 'PAUSE' : isPaused ? 'RESUME' : 'START'}
          </Text>
        </TouchableOpacity>

        {/* Skip Disc Button */}
        <TouchableOpacity
          style={[styles.discBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
          onPress={handleSkipPress}
          accessibilityRole="button"
          accessibilityLabel="Skip to next session"
        >
          <Text style={[styles.discBtnIcon, { color: colors.textSecondary }]}>⇥</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        isDestructive={true}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        onConfirm={() => {
          setConfirmModal((prev) => ({ ...prev, visible: false }));
          confirmModal.action();
        }}
        colors={colors}
      />

      {/* Direct Duration Selector Modal */}
      <Modal
        visible={durationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDurationModalOpen(false)}
          />
          <View style={[styles.dialogCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
                Set Duration
              </Text>
              <TouchableOpacity onPress={() => setDurationModalOpen(false)} style={styles.dialogCloseBtn}>
                <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dialogInputCenterRow}>
              <View style={[styles.dialogNumberBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <TextInput
                  style={[styles.dialogTextInput, { color: colors.textPrimary }]}
                  value={durationInputVal}
                  onChangeText={setDurationInputVal}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  placeholder="25"
                  placeholderTextColor={colors.textMuted}
                  autoFocus={true}
                  maxLength={4}
                  textAlign="center"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const num = parseInt(durationInputVal.trim(), 10);
                    if (!isNaN(num) && num > 0) {
                      setCurrentBlockMinutes(num);
                    }
                    setDurationModalOpen(false);
                  }}
                />
              </View>
              <Text style={[styles.dialogInputUnit, { color: colors.textSecondary }]}>min</Text>
              <TouchableOpacity
                style={[styles.dialogApplyBtn, { backgroundColor: stageAccentColor }]}
                onPress={() => {
                  const num = parseInt(durationInputVal.trim(), 10);
                  if (!isNaN(num) && num > 0) {
                    setCurrentBlockMinutes(num);
                  }
                  setDurationModalOpen(false);
                }}
              >
                <Text style={styles.dialogApplyText}>Set</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.presetsSubhead, { color: colors.textSecondary }]}>QUICK PRESETS:</Text>
            <View style={styles.presetsWrap}>
              {[1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: currentBlock.minutes === preset ? stageAccentColor : colors.surfaceBorder,
                      backgroundColor: currentBlock.minutes === preset ? colors.surface : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setCurrentBlockMinutes(preset);
                    setDurationModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: currentBlock.minutes === preset ? stageAccentColor : colors.textPrimary },
                    ]}
                  >
                    {preset}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    minHeight: 48,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  completedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  trophyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completedHeading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  completedSubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedSummaryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  completedSummaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  dotPill: {
    height: 5,
    borderRadius: 2.5,
  },
  quickDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
  },
  quickDurationText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actionPod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  discBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discBtnIcon: {
    fontSize: 20,
    fontWeight: '500',
  },
  heroPillBtn: {
    width: 170,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    alignSelf: 'center',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dialogCloseBtn: {
    padding: 4,
    minHeight: 36,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogInputCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  dialogNumberBox: {
    width: 80,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTextInput: {
    width: '100%',
    height: '100%',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
  },
  dialogInputUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogApplyBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogApplyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  presetsSubhead: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
