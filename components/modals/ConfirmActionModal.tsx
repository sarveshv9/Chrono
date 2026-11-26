import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  isDestructive = true,
  onCancel,
  onConfirm,
  colors,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
              onPress={() => {
                HapticService.buttonPress();
                onCancel();
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.btnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: isDestructive ? colors.danger : colors.accentFocus },
              ]}
              onPress={() => {
                HapticService.buttonPress();
                onConfirm();
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
