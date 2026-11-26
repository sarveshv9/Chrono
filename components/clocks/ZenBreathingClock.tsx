import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface ZenBreathingClockProps {
  remainingMs: number;
  colors: ThemeColors;
  stageColor?: string;
  size?: number;
  isRunning?: boolean;
}

export const ZenBreathingClock: React.FC<ZenBreathingClockProps> = React.memo(({
  remainingMs,
  colors,
  stageColor,
  size = 316,
  isRunning = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const activeColor = stageColor || colors.accentActive;

  useEffect(() => {
    if (!isRunning) {
      Animated.timing(scale, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isRunning, scale]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const haloSize = Math.round(size * 0.88);
  const coreSize = Math.round(size * 0.68);
  const digitsFontSize = Math.round(size * 0.23);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.breathingContainer,
          { width: haloSize, height: haloSize, transform: [{ scale }] },
        ]}
      >
        <View
          style={[
            styles.breathingHalo,
            {
              width: haloSize,
              height: haloSize,
              borderRadius: haloSize / 2,
              borderColor: activeColor,
            },
          ]}
        />
        <View
          style={[
            styles.breathingCore,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor: activeColor + '18',
            },
          ]}
        />
      </Animated.View>
      <View style={styles.contentOverlay}>
        <Text
          maxFontSizeMultiplier={1.15}
          style={[styles.digits, { color: colors.textPrimary, fontSize: digitsFontSize }]}
        >
          {timeFormatted}
        </Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          Breathe & Focus
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingHalo: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth * 2.5,
    opacity: 0.5,
  },
  breathingCore: {
    opacity: 0.35,
  },
  contentOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digits: {
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 12,
    opacity: 0.75,
  },
});
