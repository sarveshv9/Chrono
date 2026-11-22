import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface DigitalClockProps {
  remainingMs: number;
  totalDurationMs: number;
  colors: ThemeColors;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  remainingMs,
  totalDurationMs,
  colors,
}) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = totalDurationMs > 0 ? (remainingMs / totalDurationMs) * 100 : 0;

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
            { backgroundColor: colors.progressFill, width: `${progressPercent}%` },
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
    paddingHorizontal: 20,
  },
  digits: {
    fontSize: 84,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    marginBottom: 20,
  },
  trackBar: {
    width: 200,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 2,
  },
});
