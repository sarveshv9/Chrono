import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface ZenBreathingClockProps {
  remainingMs: number;
  colors: ThemeColors;
  stageColor?: string;
}

export const ZenBreathingClock: React.FC<ZenBreathingClockProps> = ({
  remainingMs,
  colors,
  stageColor,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const activeColor = stageColor || colors.accentActive;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [scale]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.breathingContainer, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.breathingHalo,
            {
              borderColor: activeColor,
            },
          ]}
        />
        <View
          style={[
            styles.breathingCore,
            {
              backgroundColor: activeColor + '18',
            },
          ]}
        />
      </Animated.View>
      <View style={styles.contentOverlay}>
        <Text style={[styles.digits, { color: colors.textPrimary }]}>
          {timeFormatted}
        </Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          Breathe & Focus
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: StyleSheet.hairlineWidth * 2,
    opacity: 0.45,
  },
  breathingCore: {
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.35,
  },
  contentOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digits: {
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
    opacity: 0.7,
  },
});
