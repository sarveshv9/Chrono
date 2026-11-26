import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface DigitalClockProps {
  remainingMs: number;
  totalDurationMs: number;
  colors: ThemeColors;
  stageColor?: string;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  remainingMs,
  totalDurationMs,
  colors,
  stageColor,
}) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = totalDurationMs > 0 ? (remainingMs / totalDurationMs) * 100 : 0;
  const barColor = stageColor || colors.progressFill;

  return (
    <View style={styles.container}>
      <Text style={[styles.digits, { color: colors.textPrimary }]}>
        {timeFormatted}
      </Text>

      {/* Minimal status hairline */}
      <View style={[styles.trackBar, { backgroundColor: colors.progressTrack }]}>
        <View
          style={[
            styles.fillBar,
            { backgroundColor: barColor, width: `${progressPercent}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  digits: {
    fontSize: 104,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -3,
    marginBottom: 26,
  },
  trackBar: {
    width: 280,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
});
