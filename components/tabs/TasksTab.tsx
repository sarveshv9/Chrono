import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface TasksTabProps {
  colors: ThemeColors;
}

export const TasksTab: React.FC<TasksTabProps> = ({ colors }) => {
  const tasks = useTimerStore((state) => state.tasks);
  const activeTaskId = useTimerStore((state) => state.activeTaskId);
  const setActiveTaskId = useTimerStore((state) => state.setActiveTaskId);
  const addTask = useTimerStore((state) => state.addTask);
  const deleteTask = useTimerStore((state) => state.deleteTask);
  const setActiveTab = useTimerStore((state) => state.setActiveTab);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF453A');

  const palette = ['#FF453A', '#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2'];

  const handleAdd = () => {
    if (!name.trim()) return;
    HapticService.buttonPress();
    addTask(name, selectedColor);
    setName('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tasks & Projects</Text>
      <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
        Track completed focus sessions per project
      </Text>

      {/* New Task Bar */}
      <View style={[styles.newCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary, backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder },
          ]}
          placeholder="New task name..."
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.newRow}>
          <View style={styles.colorRow}>
            {palette.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderColor: selectedColor === c ? colors.textPrimary : 'transparent',
                  },
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accentFocus }]}
            onPress={handleAdd}
          >
            <Text style={styles.addBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          return (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                {
                  backgroundColor: isActive ? colors.surface : colors.cardBg,
                  borderColor: isActive ? colors.accentFocus : colors.surfaceBorder,
                },
              ]}
              onPress={() => {
                HapticService.buttonPress();
                setActiveTaskId(task.id);
                setActiveTab('timer');
              }}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.indicatorDot, { backgroundColor: task.color }]} />
                <View>
                  <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
                    {task.name}
                  </Text>
                  <Text style={[styles.taskCount, { color: colors.textSecondary }]}>
                    {task.completedSessions} focus {task.completedSessions === 1 ? 'session' : 'sessions'} completed
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.accentFocus }]}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                {tasks.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      HapticService.buttonPress();
                      deleteTask(task.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={[styles.deleteText, { color: colors.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
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
  newCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  newRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCount: {
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
