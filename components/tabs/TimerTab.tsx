import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTimerStore, StageType } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { CircularRingClock } from '@/components/clocks/CircularRingClock';
import { DigitalClock } from '@/components/clocks/DigitalClock';
import { FlipClock } from '@/components/clocks/FlipClock';
import { ZenBreathingClock } from '@/components/clocks/ZenBreathingClock';
import { TaskPickerModal } from '@/components/modals/TaskPickerModal';
import { DurationPickerModal } from '@/components/modals/DurationPickerModal';
import { ConfirmStopModal } from '@/components/modals/ConfirmStopModal';
import { HapticService } from '@/services/hapticsService';

interface TimerTabProps {
  colors: ThemeColors;
}

export const TimerTab: React.FC<TimerTabProps> = ({ colors }) => {
  const {
    stage,
    status,
    cycleCount,
    remainingMs,
    totalDurationMs,
    settings,
    tasks,
    activeTaskId,
    setStage,
    start,
    pause,
    resume,
    stop,
    skip,
    extendFiveMinutes,
  } = useTimerStore();

  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0] || {
    id: 'default',
    name: 'Deep Work',
    color: colors.accentFocus,
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isIdle = status === 'idle';

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const renderCycleDots = () => {
    const totalDots = settings.longBreakInterval;
    const dots = [];
    for (let i = 1; i <= totalDots; i++) {
      const isFilled = i <= cycleCount;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: isFilled ? colors.accentFocus : 'transparent',
              borderColor: colors.accentFocus,
            },
          ]}
        />
      );
    }
    return <View style={styles.dotsRow}>{dots}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Top Header Rail: Empty left, Task Picker Chip on right */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <TouchableOpacity
          style={[styles.taskChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            HapticService.buttonPress();
            setIsTaskPickerOpen(true);
          }}
          accessibilityLabel={`Active task: ${activeTask.name}. Tap to change task.`}
          accessibilityRole="button"
        >
          <View style={[styles.taskDot, { backgroundColor: activeTask.color }]} />
          <Text style={[styles.taskChipText, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeTask.name}
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control (Visible only when idle or paused) */}
      {(isIdle || isPaused) && (
        <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {(['focus', 'shortBreak', 'longBreak'] as StageType[]).map((stg) => {
            const isSelected = stage === stg;
            const labels: Record<StageType, string> = {
              focus: 'Focus',
              shortBreak: 'Short Break',
              longBreak: 'Long Break',
            };
            return (
              <TouchableOpacity
                key={stg}
                style={[
                  styles.segmentButton,
                  isSelected && { backgroundColor: colors.accentFocus },
                ]}
                onPress={() => {
                  HapticService.buttonPress();
                  setStage(stg);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {labels[stg]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Center Clock Canvas */}
      <View
        style={styles.clockSection}
        accessible
        accessibilityLabel={`Timer: ${timeFormatted}, ${stage === 'focus' ? 'Focus' : 'Break'} session`}
      >
        <TouchableOpacity
          activeOpacity={isIdle ? 0.7 : 1}
          onPress={() => {
            if (isIdle) {
              HapticService.buttonPress();
              setIsDurationPickerOpen(true);
            }
          }}
          disabled={!isIdle}
        >
          {settings.visualClockStyle === 'ring' && (
            <CircularRingClock
              remainingMs={remainingMs}
              totalDurationMs={totalDurationMs}
              colors={colors}
            />
          )}
          {settings.visualClockStyle === 'sandglass' && (
            <DigitalClock
              remainingMs={remainingMs}
              totalDurationMs={totalDurationMs}
              colors={colors}
            />
          )}
          {settings.visualClockStyle === 'flip' && (
            <FlipClock remainingMs={remainingMs} colors={colors} />
          )}
          {settings.visualClockStyle === 'breathing' && (
            <ZenBreathingClock remainingMs={remainingMs} colors={colors} />
          )}
        </TouchableOpacity>

        {/* Cycle Progress Dots */}
        {stage === 'focus' && (
          <View style={styles.cycleWrapper}>
            {renderCycleDots()}
            <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>
              Session {cycleCount} of {settings.longBreakInterval}
            </Text>
          </View>
        )}
      </View>

      {/* Primary Contextual Action Area */}
      <View style={styles.actionSection}>
        {/* State: Completed -> Single "Start Break / Focus" button */}
        {isCompleted && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accentShortBreak }]}
            onPress={() => start()}
          >
            <Text style={styles.primaryBtnText}>
              Start {stage === 'focus' ? 'Break' : 'Focus'}
            </Text>
          </TouchableOpacity>
        )}

        {/* State: Idle -> Single prominent Start button */}
        {isIdle && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accentFocus }]}
            onPress={() => start()}
          >
            <Text style={styles.primaryBtnText}>Start {stage === 'focus' ? 'Focus' : 'Break'}</Text>
          </TouchableOpacity>
        )}

        {/* State: Running -> Pause button + Stop + +5m */}
        {isRunning && (
          <View style={styles.runningActionGroup}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accentFocus }]}
              onPress={() => pause()}
            >
              <Text style={styles.primaryBtnText}>Pause</Text>
            </TouchableOpacity>

            <View style={styles.runningAuxRow}>
              <TouchableOpacity
                style={[styles.auxBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => extendFiveMinutes()}
              >
                <Text style={[styles.auxBtnText, { color: colors.textPrimary }]}>+5 min</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.auxBtn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
                onPress={() => setIsStopConfirmOpen(true)}
              >
                <Text style={[styles.auxBtnText, { color: colors.danger }]}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State: Paused -> Resume + Reset + Skip */}
        {isPaused && (
          <View style={styles.pausedActionGroup}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accentFocus }]}
              onPress={() => resume()}
            >
              <Text style={styles.primaryBtnText}>Resume</Text>
            </TouchableOpacity>

            <View style={styles.runningAuxRow}>
              <TouchableOpacity
                style={[styles.auxBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => skip()}
              >
                <Text style={[styles.auxBtnText, { color: colors.textPrimary }]}>Skip ⏭</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.auxBtn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
                onPress={() => stop()}
              >
                <Text style={[styles.auxBtnText, { color: colors.textSecondary }]}>Reset ↺</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Contextual Modals */}
      <TaskPickerModal
        visible={isTaskPickerOpen}
        onClose={() => setIsTaskPickerOpen(false)}
        colors={colors}
      />
      <DurationPickerModal
        visible={isDurationPickerOpen}
        onClose={() => setIsDurationPickerOpen(false)}
        colors={colors}
      />
      <ConfirmStopModal
        visible={isStopConfirmOpen}
        onCancel={() => setIsStopConfirmOpen(false)}
        onConfirm={() => {
          setIsStopConfirmOpen(false);
          stop();
        }}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
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
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
    gap: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskChipText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  chevron: {
    fontSize: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginTop: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clockSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  cycleLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actionSection: {
    width: '100%',
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  runningActionGroup: {
    width: '100%',
    gap: 10,
  },
  pausedActionGroup: {
    width: '100%',
    gap: 10,
  },
  runningAuxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  auxBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  auxBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
