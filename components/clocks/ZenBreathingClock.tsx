import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface ZenBreathingClockProps {
  remainingMs: number;
  colors: ThemeColors;
}

export const ZenBreathingClock: React.FC<ZenBreathingClockProps> = ({
  remainingMs,
  colors,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

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
            styles.breathingOrb,
            {
              backgroundColor: colors.surface,
              borderColor: colors.accentActive,
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
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingOrb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    opacity: 0.35,
  },
  contentOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digits: {
    fontSize: 54,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  caption: {
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
