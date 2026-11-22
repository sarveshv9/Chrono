import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTimerStore, ClockStyle } from '@/store/useTimerStore';
import { THEMES, ThemePreset } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface QuickAdjustDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenStudio: () => void;
}

export const QuickAdjustDrawer: React.FC<QuickAdjustDrawerProps> = ({
  visible,
  onClose,
  onOpenStudio,
}) => {
  const settings = useTimerStore((state) => state.settings);
  const updateSettings = useTimerStore((state) => state.updateSettings);
  const theme = THEMES[settings.themePreset];
  const colors = theme.colors;

  const durationOptions = [15, 25, 45, 60];
  const clockStyles: { id: ClockStyle; label: string }[] = [
    { id: 'ring', label: 'Ring' },
    { id: 'flip', label: 'Flip' },
    { id: 'sandglass', label: 'Digital' },
    { id: 'breathing', label: 'Zen' },
  ];
  const themePresets: { id: ThemePreset; label: string }[] = [
    { id: 'oled', label: 'OLED' },
    { id: 'papyrus', label: 'Papyrus' },
    { id: 'neon', label: 'Neon' },
    { id: 'matcha', label: 'Matcha' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Adjust</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Session Duration Preset */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FOCUS DURATION</Text>
            <View style={styles.row}>
              {durationOptions.map((min) => {
                const isSelected = settings.focusDurationMin === min;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? colors.accentFocus : colors.cardBg,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      HapticService.buttonPress();
                      updateSettings({ focusDurationMin: min });
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {min}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clock Visualizer Style */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CLOCK STYLE</Text>
            <View style={styles.row}>
              {clockStyles.map((item) => {
                const isSelected = settings.visualClockStyle === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? colors.accentFocus : colors.cardBg,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      HapticService.buttonPress();
                      updateSettings({ visualClockStyle: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Theme Presets */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THEME PRESET</Text>
            <View style={styles.row}>
              {themePresets.map((item) => {
                const isSelected = settings.themePreset === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isSelected ? colors.accentFocus : colors.cardBg,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      HapticService.buttonPress();
                      updateSettings({ themePreset: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Open Full Studio Button */}
            <TouchableOpacity
              style={[styles.studioBtn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
              onPress={() => {
                onClose();
                onOpenStudio();
              }}
            >
              <Text style={[styles.studioBtnText, { color: colors.accentActive }]}>
                Open Focus Studio (Custom Everything) →
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '65%',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  studioBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  studioBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
