import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface FlipClockProps {
  remainingMs: number;
  colors: ThemeColors;
}

export const FlipClock: React.FC<FlipClockProps> = ({ remainingMs, colors }) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  const renderCard = (val: string) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.cardText, { color: colors.textPrimary }]}>{val}</Text>
      <View style={[styles.cardDivider, { backgroundColor: colors.surfaceBorder }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCard(minStr)}
      <Text style={[styles.colon, { color: colors.textSecondary }]}>:</Text>
      {renderCard(secStr)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 110,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
  },
  cardText: {
    fontSize: 64,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cardDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
  },
  colon: {
    fontSize: 48,
    fontWeight: '300',
    marginHorizontal: 10,
  },
});
