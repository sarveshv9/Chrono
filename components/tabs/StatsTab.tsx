import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';

interface StatsTabProps {
  colors: ThemeColors;
}

export const StatsTab: React.FC<StatsTabProps> = ({ colors }) => {
  const stats = useTimerStore((state) => state.stats);
  const settings = useTimerStore((state) => state.settings);
  const history = useTimerStore((state) => state.history);

  const goal = settings.dailyGoalSessions;
  const currentToday = stats.completedSessions;
  const progressPercent = Math.min(100, Math.round((currentToday / goal) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Statistics</Text>
      <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
        Daily goals, focus streak, and session history
      </Text>

      {/* Goal & Streak Bento */}
      <View style={styles.bentoRow}>
        <View style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>DAILY GOAL</Text>
          <Text style={[styles.bentoValue, { color: colors.accentFocus }]}>
            {currentToday} <Text style={{ fontSize: 16, color: colors.textSecondary }}>/ {goal}</Text>
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.accentFocus, width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressCaption, { color: colors.textMuted }]}>
            {progressPercent}% of goal completed
          </Text>
        </View>

        <View style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>STREAK</Text>
          <Text style={[styles.bentoValue, { color: colors.accentFocus }]}>
            {stats.streakDays} <Text style={{ fontSize: 20 }}>🔥</Text>
          </Text>
          <Text style={[styles.bentoSub, { color: colors.textSecondary }]}>
            Consecutive focus days
          </Text>
        </View>
      </View>

      {/* Total Focus Minutes */}
      <View style={[styles.metricBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>LIFETIME FOCUS</Text>
          <Text style={[styles.metricNum, { color: colors.textPrimary }]}>
            {stats.totalFocusMinutes} <Text style={{ fontSize: 16, color: colors.textSecondary }}>minutes</Text>
          </Text>
        </View>
        <Text style={{ fontSize: 32 }}>⏱</Text>
      </View>

      {/* Weekly Activity Mockup */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THIS WEEK</Text>
      <View style={[styles.weekCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
          const heights = [40, 70, 50, 90, 60, 30, currentToday > 0 ? 80 : 20];
          return (
            <View key={idx} style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: colors.cardBg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: idx === 6 ? colors.accentFocus : colors.accentShortBreak,
                      height: `${heights[idx]}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barDay, { color: colors.textSecondary }]}>{day}</Text>
            </View>
          );
        })}
      </View>

      {/* Session History Log */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT SESSIONS</Text>
      {history.length === 0 ? (
        <View style={[styles.emptyHistory, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No completed sessions recorded yet. Start a focus block to see your history!
          </Text>
        </View>
      ) : (
        history.map((item) => (
          <View
            key={item.id}
            style={[styles.historyRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View>
              <Text style={[styles.historyTask, { color: colors.textPrimary }]}>{item.taskName}</Text>
              <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                Completed at {item.completedAt}
              </Text>
            </View>
            <Text style={[styles.historyMinutes, { color: colors.accentFocus }]}>
              +{item.durationMinutes}m
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bentoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bentoValue: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 8,
  },
  bentoSub: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressCaption: {
    fontSize: 11,
  },
  metricBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricNum: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  weekCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  barCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 80,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyHistory: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyTask: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 12,
    marginTop: 2,
  },
  historyMinutes: {
    fontSize: 15,
    fontWeight: '700',
  },
});
