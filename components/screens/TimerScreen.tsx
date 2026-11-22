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
import { CircularRingClock } from '@/components/clocks/CircularRingClock';
import { DigitalClock } from '@/components/clocks/DigitalClock';
import { FlipClock } from '@/components/clocks/FlipClock';
import { ZenBreathingClock } from '@/components/clocks/ZenBreathingClock';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { HapticService } from '@/services/hapticsService';

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

  // Calculate session number in focus blocks
  const focusBlocks = activeBlocks.filter((b) => b.type === 'focus');
  const currentFocusIndex = activeBlocks
    .slice(0, currentBlockIndex + 1)
    .filter((b) => b.type === 'focus').length;

  const totalFocusCount = plan.sessionCount === 'unlimited' ? '∞' : `${focusBlocks.length}`;

  const getStageHeader = () => {
    if (currentBlock.type === 'focus') {
      return `Session ${currentFocusIndex || 1} of ${totalFocusCount}`;
    } else if (currentBlock.type === 'long') {
      return 'Long Break';
    } else {
      return 'Short Break';
    }
  };

  const stageAccentColor =
    currentBlock.type === 'focus'
      ? colors.accentFocus
      : currentBlock.type === 'long'
      ? colors.accentLongBreak
      : colors.accentShortBreak;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const renderProgressDots = () => {
    if (plan.sessionCount === 'unlimited') return null;
    return (
      <View style={styles.dotsRow}>
        {focusBlocks.map((_, idx) => {
          const isFilled = idx < currentFocusIndex;
          const isCurrent = idx === currentFocusIndex - 1 && currentBlock.type === 'focus';
          const pillWidth = isCurrent ? 22 : isFilled ? 14 : 6;
          return (
            <View
              key={idx}
              style={[
                styles.dotPill,
                {
                  width: pillWidth,
                  backgroundColor: isFilled || isCurrent ? colors.accentFocus : colors.progressTrack,
                  opacity: isFilled || isCurrent ? 1 : 0.4,
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
      {/* Top Header Rail: Brand & Plan capsule */}
      <View style={styles.header}>
        <Text style={[styles.brandTitle, { color: colors.textMuted }]}>CHRONOCRAFT</Text>
        <TouchableOpacity
          style={[styles.planBtn, { backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            setCurrentScreen('plan');
          }}
          accessibilityLabel="Open Plan settings"
          accessibilityRole="button"
        >
          <Text style={[styles.planBtnText, { color: colors.textPrimary }]}>Plan ›</Text>
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
            />
          )}
          {plan.visualClockStyle === 'sandglass' && (
            <DigitalClock
              remainingMs={remainingMs}
              totalDurationMs={totalDurationMs}
              colors={colors}
            />
          )}
          {plan.visualClockStyle === 'flip' && (
            <FlipClock remainingMs={remainingMs} colors={colors} />
          )}
          {plan.visualClockStyle === 'breathing' && (
            <ZenBreathingClock remainingMs={remainingMs} colors={colors} />
          )}
        </TouchableOpacity>

        {/* Plan Progress Oblong Indicators */}
        {renderProgressDots()}

        {/* Duration Badge (when idle) */}
        {!isRunning && !isPaused && (
          <TouchableOpacity
            style={[styles.quickDurationBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            onPress={() => {
              HapticService.buttonPress();
              setDurationInputVal(String(currentBlock.minutes));
              setDurationModalOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Change duration for this session, currently ${currentBlock.minutes} minutes`}
          >
            <Text style={[styles.quickDurationText, { color: colors.textSecondary }]}>
              {currentBlock.minutes} MIN FOCUS <Text style={{ color: stageAccentColor }}>▾</Text>
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

        {/* Hero Capsule Start/Pause Button */}
        <TouchableOpacity
          style={[styles.heroPillBtn, { backgroundColor: stageAccentColor }]}
          onPress={() => {
            HapticService.buttonPress();
            if (isRunning) {
              pause();
            } else if (isPaused) {
              resume();
            } else {
              start();
            }
          }}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause timer' : isPaused ? 'Resume timer' : 'Start timer'}
        >
          <Text style={styles.heroPillText}>
            {isRunning ? 'PAUSE' : isPaused ? 'RESUME' : 'START'}
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

            <View style={[styles.dialogInputRow, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <TextInput
                style={[styles.dialogTextInput, { color: colors.textPrimary }]}
                value={durationInputVal}
                onChangeText={setDurationInputVal}
                keyboardType="number-pad"
                selectTextOnFocus
                placeholder="Enter minutes..."
                placeholderTextColor={colors.textMuted}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={() => {
                  const num = parseInt(durationInputVal.trim(), 10);
                  if (!isNaN(num) && num > 0) {
                    setCurrentBlockMinutes(num);
                  }
                  setDurationModalOpen(false);
                }}
              />
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
  planBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dialogCloseBtn: {
    padding: 4,
    minHeight: 36,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  dialogTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 8,
  },
  dialogInputUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  dialogApplyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
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
