import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface TaskPickerModalProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}

export const TaskPickerModal: React.FC<TaskPickerModalProps> = ({
  visible,
  onClose,
  colors,
}) => {
  const tasks = useTimerStore((state) => state.tasks);
  const activeTaskId = useTimerStore((state) => state.activeTaskId);
  const setActiveTaskId = useTimerStore((state) => state.setActiveTaskId);
  const addTask = useTimerStore((state) => state.addTask);

  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF453A');

  const colorOptions = ['#FF453A', '#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2'];

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    HapticService.buttonPress();
    addTask(newTaskName, selectedColor);
    setNewTaskName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Select Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
            {tasks.map((task) => {
              const isSelected = task.id === activeTaskId;
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskRow,
                    {
                      backgroundColor: isSelected ? colors.cardBg : 'transparent',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => {
                    HapticService.buttonPress();
                    setActiveTaskId(task.id);
                    onClose();
                  }}
                >
                  <View style={styles.taskLeft}>
                    <View style={[styles.colorDot, { backgroundColor: task.color }]} />
                    <Text
                      style={[
                        styles.taskName,
                        {
                          color: colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {task.name}
                    </Text>
                  </View>

                  <View style={styles.taskRight}>
                    <Text style={[styles.pomodoroCount, { color: colors.textSecondary }]}>
                      {task.completedSessions} 🍅
                    </Text>
                    {isSelected && (
                      <Text style={[styles.checkMark, { color: colors.accentFocus }]}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Create Task */}
          <View style={[styles.createSection, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[styles.createLabel, { color: colors.textSecondary }]}>NEW TASK</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.cardBg,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
                placeholder="e.g. Write architecture notes..."
                placeholderTextColor={colors.textMuted}
                value={newTaskName}
                onChangeText={setNewTaskName}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.accentFocus }]}
                onPress={handleCreateTask}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colorRow}>
              {colorOptions.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorPickerDot,
                    {
                      backgroundColor: c,
                      borderColor: selectedColor === c ? colors.textPrimary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskList: {
    maxHeight: 220,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskName: {
    fontSize: 15,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pomodoroCount: {
    fontSize: 13,
  },
  checkMark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  createLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  colorPickerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});
