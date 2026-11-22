import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTimerStore } from '@/store/useTimerStore';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface DurationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}

export const DurationPickerModal: React.FC<DurationPickerModalProps> = ({
  visible,
  onClose,
  colors,
}) => {
  const stage = useTimerStore((state) => state.stage);
  const settings = useTimerStore((state) => state.settings);
  const setCurrentDurationMin = useTimerStore((state) => state.setCurrentDurationMin);

  const getCurrentMinutes = () => {
    switch (stage) {
      case 'focus':
        return settings.focusDurationMin;
      case 'shortBreak':
        return settings.shortBreakDurationMin;
      case 'longBreak':
        return settings.longBreakDurationMin;
    }
  };

  const currentMinutes = getCurrentMinutes();
  const [customValue, setCustomValue] = useState(currentMinutes);

  const presets = stage === 'focus' ? [15, 25, 45, 60] : [3, 5, 10, 15];

  const handleSelect = (mins: number) => {
    HapticService.buttonPress();
    setCurrentDurationMin(mins);
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Set {stage === 'focus' ? 'Focus' : 'Break'} Length
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.presetGrid}>
            {presets.map((min) => {
              const isSelected = currentMinutes === min;
              return (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.accentFocus : colors.cardBg,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => handleSelect(min)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {min} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Precision Stepper */}
          <Text style={[styles.customLabel, { color: colors.textSecondary }]}>CUSTOM DURATION</Text>
          <View style={[styles.stepperContainer, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
              onPress={() => {
                HapticService.buttonPress();
                if (customValue > 1) setCustomValue(customValue - 1);
              }}
            >
              <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>-</Text>
            </TouchableOpacity>

            <Text style={[styles.stepperValue, { color: colors.accentActive }]}>
              {customValue} <Text style={{ fontSize: 16, color: colors.textSecondary }}>min</Text>
            </Text>

            <TouchableOpacity
              style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
              onPress={() => {
                HapticService.buttonPress();
                if (customValue < 120) setCustomValue(customValue + 1);
              }}
            >
              <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.accentFocus }]}
            onPress={() => handleSelect(customValue)}
          >
            <Text style={styles.applyBtnText}>Apply Duration</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
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
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  customLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  applyBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
