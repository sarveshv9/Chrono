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
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: isFilled ? colors.accentFocus : 'transparent',
                  borderColor: isCurrent ? colors.textPrimary : colors.accentFocus,
                  opacity: isFilled || isCurrent ? 1 : 0.35,
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
      {/* Top Header Rail: Plan button on the top right */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <TouchableOpacity
          style={[styles.planBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
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
        <Text style={[styles.stageHeading, { color: stageAccentColor }]}>
          {getStageHeader()}
        </Text>

        <View style={styles.clockWrapper}>
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
        </View>

        {/* Plan Progress Dots */}
        {renderProgressDots()}

        {/* Quick Duration Pill (when idle) */}
        {!isRunning && !isPaused && (
          <TouchableOpacity
            style={[styles.quickDurationPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => {
              HapticService.buttonPress();
              setDurationInputVal(String(currentBlock.minutes));
              setDurationModalOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Change duration for this session, currently ${currentBlock.minutes} minutes`}
          >
            <Text style={[styles.quickDurationText, { color: stageAccentColor }]}>
              {currentBlock.minutes} min ✎
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Action Button & Text Actions */}
      <View style={styles.actionSection}>
        {/* Single Primary Start / Pause Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: stageAccentColor }]}
          onPress={() => {
            if (isRunning) {
              pause();
            } else if (isPaused) {
              resume();
            } else {
              start();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause timer' : isPaused ? 'Resume timer' : 'Start timer'}
        >
          <Text style={styles.primaryBtnText}>
            {isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
          </Text>
        </TouchableOpacity>

        {/* Secondary Plain Text Actions: Skip & Reset */}
        <View style={styles.textActionRow}>
          <TouchableOpacity
            style={styles.textBtn}
            onPress={handleSkipPress}
            accessibilityRole="button"
            accessibilityLabel="Skip to next block"
          >
            <Text style={[styles.textBtnText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={handleResetPress}
            accessibilityRole="button"
            accessibilityLabel="Reset current block"
          >
            <Text style={[styles.textBtnText, { color: colors.textSecondary }]}>Reset</Text>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    minHeight: 48,
  },
  headerLeft: {
    flex: 1,
  },
  planBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  clockSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
  },
  quickDurationText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  textBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtnText: {
    fontSize: 15,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  dialogInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
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
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
