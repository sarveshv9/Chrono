import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '@/theme/tokens';

interface FlipClockProps {
  remainingMs: number;
  colors: ThemeColors;
  size?: number;
}

const FlipCard: React.FC<{
  value: string;
  width: number;
  height: number;
  fontSize: number;
  colors: ThemeColors;
}> = ({ value, width, height, fontSize, colors }) => {
  const flipAnim = useRef(new Animated.Value(1)).current;
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      flipAnim.setValue(0.86);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [value, flipAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          transform: [{ scaleY: flipAnim }],
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.15}
        style={[styles.cardText, { color: colors.textPrimary, fontSize }]}
      >
        {value}
      </Text>
      <View style={[styles.cardDivider, { backgroundColor: colors.surfaceBorder }]} />
    </Animated.View>
  );
};

export const FlipClock: React.FC<FlipClockProps> = React.memo(({ remainingMs, colors, size = 316 }) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  const cardWidth = Math.round(size * 0.44);
  const cardHeight = Math.round(size * 0.51);
  const fontSize = Math.round(size * 0.27);
  const colonSize = Math.round(size * 0.19);

  return (
    <View style={styles.container}>
      <FlipCard value={minStr} width={cardWidth} height={cardHeight} fontSize={fontSize} colors={colors} />
      <Text style={[styles.colon, { color: colors.textSecondary, fontSize: colonSize }]}>:</Text>
      <FlipCard value={secStr} width={cardWidth} height={cardHeight} fontSize={fontSize} colors={colors} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardText: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cardDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
  },
  colon: {
    fontWeight: '300',
    marginHorizontal: 10,
  },
});
