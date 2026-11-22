import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTimerStore, StageType } from '@/store/useTimerStore';
import { THEMES } from '@/theme/tokens';
import { CircularRingClock } from '@/components/clocks/CircularRingClock';
import { DigitalClock } from '@/components/clocks/DigitalClock';
import { FlipClock } from '@/components/clocks/FlipClock';
import { ZenBreathingClock } from '@/components/clocks/ZenBreathingClock';
import { QuickAdjustDrawer } from '@/components/QuickAdjustDrawer';
import { StudioModal } from '@/components/StudioModal';
import { HapticService } from '@/services/hapticsService';

export const ZenCanvas: React.FC = () => {
  const {
    settings,
    status,
    stage,
    cycleCount,
    remainingMs,
    totalDurationMs,
    toggleStartPause,
    extendFiveMinutes,
    skip,
    reset,
    setStage,
  } = useTimerStore();

  const theme = THEMES[settings.themePreset];
  const colors = theme.colors;

  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Stage labels and colors
  const getStageInfo = (stg: StageType) => {
    switch (stg) {
      case 'focus':
        return {
          title: `FOCUS (${cycleCount} OF ${settings.longBreakInterval})`,
          color: colors.accentFocus,
        };
      case 'shortBreak':
        return {
          title: 'SHORT BREAK',
          color: colors.accentShortBreak,
        };
      case 'longBreak':
        return {
          title: 'LONG BREAK',
          color: colors.accentLongBreak,
        };
    }
  };

  const stageInfo = getStageInfo(stage);
  const isRunning = status === 'running';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.container}>
        {/* Top Header Rail */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => setIsStudioOpen(true)}
          >
            <View style={[styles.statusDot, { backgroundColor: stageInfo.color }]} />
            <Text style={[styles.tagText, { color: colors.textPrimary }]}>
              #{settings.activeTag}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={() => {
                HapticService.buttonPress();
                setIsStudioOpen(true);
              }}
            >
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stage Selector Tabs */}
        <View style={[styles.stageTabs, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            style={[
              styles.stageTab,
              stage === 'focus' && { backgroundColor: colors.accentFocus },
            ]}
            onPress={() => {
              HapticService.buttonPress();
              setStage('focus');
            }}
          >
            <Text
              style={[
                styles.stageTabText,
                { color: stage === 'focus' ? '#FFF' : colors.textSecondary },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stageTab,
              stage === 'shortBreak' && { backgroundColor: colors.accentShortBreak },
            ]}
            onPress={() => {
              HapticService.buttonPress();
              setStage('shortBreak');
            }}
          >
            <Text
              style={[
                styles.stageTabText,
                { color: stage === 'shortBreak' ? '#FFF' : colors.textSecondary },
              ]}
            >
              Short Break
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stageTab,
              stage === 'longBreak' && { backgroundColor: colors.accentLongBreak },
            ]}
            onPress={() => {
              HapticService.buttonPress();
              setStage('longBreak');
            }}
          >
            <Text
              style={[
                styles.stageTabText,
                { color: stage === 'longBreak' ? '#FFF' : colors.textSecondary },
              ]}
            >
              Long Break
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Clock Canvas */}
        <TouchableOpacity
          style={styles.canvasArea}
          activeOpacity={0.92}
          onPress={toggleStartPause}
        >
          <Text style={[styles.stageHeading, { color: stageInfo.color }]}>
            {stageInfo.title}
          </Text>

          <View style={styles.clockWrapper}>
            {settings.visualClockStyle === 'ring' && (
              <CircularRingClock
                remainingMs={remainingMs}
                totalDurationMs={totalDurationMs}
                colors={colors}
              />
            )}
            {settings.visualClockStyle === 'flip' && (
              <FlipClock remainingMs={remainingMs} colors={colors} />
            )}
            {settings.visualClockStyle === 'sandglass' && (
              <DigitalClock
                remainingMs={remainingMs}
                totalDurationMs={totalDurationMs}
                colors={colors}
              />
            )}
            {settings.visualClockStyle === 'breathing' && (
              <ZenBreathingClock remainingMs={remainingMs} colors={colors} />
            )}
          </View>

          <Text style={[styles.tapHint, { color: colors.textMuted }]}>
            {isRunning ? 'Tap to Pause' : 'Tap to Start'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Control Bar */}
        <View style={styles.bottomControls}>
          {/* Main Play/Pause Button */}
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: stageInfo.color }]}
            onPress={toggleStartPause}
          >
            <Text style={styles.mainActionBtnText}>
              {isRunning ? 'PAUSE' : 'START FOCUS'}
            </Text>
          </TouchableOpacity>

          {/* Auxiliary Buttons (+5m, Skip, Reset) */}
          <View style={styles.auxRow}>
            <TouchableOpacity
              style={[styles.auxBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={extendFiveMinutes}
            >
              <Text style={[styles.auxBtnText, { color: colors.textPrimary }]}>+5m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.auxBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={skip}
            >
              <Text style={[styles.auxBtnText, { color: colors.textPrimary }]}>Skip ⏭</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.auxBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={reset}
            >
              <Text style={[styles.auxBtnText, { color: colors.textSecondary }]}>Reset ↺</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Adjust Button */}
          <TouchableOpacity
            style={[styles.quickAdjustPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => {
              HapticService.buttonPress();
              setIsQuickDrawerOpen(true);
            }}
          >
            <Text style={[styles.quickAdjustText, { color: colors.textSecondary }]}>
              ▲ Quick Adjust ({theme.name})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <QuickAdjustDrawer
          visible={isQuickDrawerOpen}
          onClose={() => setIsQuickDrawerOpen(false)}
          onOpenStudio={() => setIsStudioOpen(true)}
        />
        <StudioModal
          visible={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginTop: 14,
  },
  stageTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  stageTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  canvasArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stageHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 24,
  },
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 12,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 12,
  },
  mainActionBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  mainActionBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  auxRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  auxBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  auxBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickAdjustPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  quickAdjustText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
