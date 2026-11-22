import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemeColors } from '@/theme/tokens';

interface CircularRingClockProps {
  remainingMs: number;
  totalDurationMs: number;
  colors: ThemeColors;
  stageColor?: string;
  size?: number;
  strokeWidth?: number;
}

export const CircularRingClock: React.FC<CircularRingClockProps> = ({
  remainingMs,
  totalDurationMs,
  colors,
  stageColor,
  size = 280,
  strokeWidth = 6.5,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDurationMs > 0 ? Math.max(0, remainingMs / totalDurationMs) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const ringColor = stageColor || colors.progressFill;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={3.5}
          strokeOpacity={0.6}
          fill="none"
        />
        {/* Foreground Progress Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text style={[styles.digits, { color: colors.textPrimary }]}>
          {timeFormatted}
        </Text>
      </View>
    </View>
  );
};

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
    fontSize: 68,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
});
