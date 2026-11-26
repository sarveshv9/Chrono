import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ThemeColors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularRingClockProps {
  remainingMs: number;
  totalDurationMs: number;
  colors: ThemeColors;
  stageColor?: string;
  size?: number;
  strokeWidth?: number;
  isRunning?: boolean;
}

export const CircularRingClock: React.FC<CircularRingClockProps> = React.memo(({
  remainingMs,
  totalDurationMs,
  colors,
  stageColor,
  size = 316,
  strokeWidth = 14,
  isRunning = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDurationMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalDurationMs)) : 0;
  const targetDashoffset = circumference * (1 - progress);
  const ringColor = stageColor || colors.progressFill;

  const animatedDashoffset = useSharedValue(targetDashoffset);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    animatedDashoffset.value = withTiming(targetDashoffset, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedDashoffset, targetDashoffset]);

  useEffect(() => {
    if (!isRunning) {
      pulseScale.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
      return;
    }

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.016, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [isRunning, pulseScale]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedDashoffset.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const digitsFontSize = Math.round(size * 0.25);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        animatedContainerStyle,
      ]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={10}
          strokeOpacity={0.6}
          fill="none"
        />
        {/* Foreground Progress Ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text
          maxFontSizeMultiplier={1.15}
          style={[styles.digits, { color: colors.textPrimary, fontSize: digitsFontSize }]}
        >
          {timeFormatted}
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digits: {
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
});
