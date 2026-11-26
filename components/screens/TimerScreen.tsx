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
  useWindowDimensions,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CircularRingClock } from '@/components/clocks/CircularRingClock';
import { DigitalClock } from '@/components/clocks/DigitalClock';
import { FlipClock } from '@/components/clocks/FlipClock';
import { ZenBreathingClock } from '@/components/clocks/ZenBreathingClock';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { HapticService } from '@/services/hapticsService';

const SettingsIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const ResetIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
  </Svg>
);

const PlayIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M6 4l14 8-14 8V4z" />
  </Svg>
);

const PauseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Rect x="6" y="4" width="4" height="16" rx="1" />
    <Rect x="14" y="4" width="4" height="16" rx="1" />
  </Svg>
);

const ChevronDownIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const SkipIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 4l10 8-10 8V4z" fill={color} />
    <Path d="M19 5v14" />
  </Svg>
);

interface TimerScreenProps {
  colors: ThemeColors;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ colors }) => {
  const { width, height } = useWindowDimensions();
  const clockSize = Math.min(Math.round(width * 0.82), Math.round(height * 0.40), 324);

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
    action: () => { },
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
      return 'Break';
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
        <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>CHRONO</Text>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('plan');
          }}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SettingsIcon size={19} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Center Clock Canvas */}
      <View
        style={styles.clockSection}
        accessible
        accessibilityLabel={`Timer, ${minutes} minutes ${seconds} seconds, ${isRunning ? 'running' : isPaused ? 'paused' : 'idle'}`}
      >
        <TouchableOpacity
          activeOpacity={isRunning || isCompleted ? 1 : 0.75}
          onPress={() => {
            if (!isRunning && !isCompleted) {
              HapticService.buttonPress();
              setDurationInputVal(String(currentBlock.minutes));
              setDurationModalOpen(true);
            }
          }}
          style={[
            styles.stagePill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${getStageHeader()}, tap to adjust duration`}
        >
          <View style={[styles.stageDot, { backgroundColor: stageAccentColor }]} />
          <Text style={[styles.stagePillText, { color: colors.textPrimary }]}>
            {getStageHeader()}
          </Text>
          {!isRunning && !isCompleted && (
            <View style={styles.stageChevron}>
              <ChevronDownIcon size={14} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

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
                size={clockSize}
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
      </View>

      {/* Stacked Action Pod: Full-Width Hero Pill + Dual Reset/Skip Pills */}
      <View style={styles.actionPod}>
        {/* Hero Capsule Start/Pause/New Cycle Button */}
        <TouchableOpacity
          style={[
            styles.heroPillBtn,
            {
              backgroundColor: stageAccentColor,
            },
          ]}
          onPress={() => {
            HapticService.buttonPress();
            if (isCompleted) {
              reset();
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
          accessibilityLabel={isCompleted ? 'Reset and start a new cycle' : isRunning ? 'Pause timer' : isPaused ? 'Resume timer' : 'Start timer'}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="btnSheen" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
                  <Stop offset="1" stopColor="#000000" stopOpacity="0.14" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" rx="35" fill="url(#btnSheen)" />
            </Svg>
          </View>
          <View style={styles.heroPillContent}>
            {isRunning ? (
              <PauseIcon size={21} color="#FFFFFF" />
            ) : isCompleted ? (
              <ResetIcon size={21} color="#FFFFFF" />
            ) : (
              <PlayIcon size={21} color="#FFFFFF" />
            )}
            <Text style={styles.heroPillText}>
              {isCompleted ? 'New Cycle' : isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Secondary Dual Pill Row: Reset & Skip */}
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={[styles.secondaryPillBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleResetPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reset current session"
          >
            <ResetIcon size={19} color={colors.textPrimary} />
            <Text style={[styles.secondaryPillText, { color: colors.textPrimary }]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryPillBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleSkipPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Skip to next session"
          >
            <SkipIcon size={18} color={colors.textPrimary} />
            <Text style={[styles.secondaryPillText, { color: colors.textPrimary }]}>Skip</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    minHeight: 50,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3.5,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
  },
  stageDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 10,
  },
  stagePillText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  stageChevron: {
    marginLeft: 8,
    marginTop: 1,
  },
  completedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  trophyIconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  completedHeading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  completedSubtext: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  completedSummaryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  completedSummaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPod: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    paddingTop: 12,
  },
  heroPillBtn: {
    width: '100%',
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 14,
    marginTop: 14,
  },
  secondaryPillBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryPillText: {
    fontSize: 16,
    fontWeight: '500',
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
