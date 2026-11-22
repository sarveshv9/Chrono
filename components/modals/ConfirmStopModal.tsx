import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { ThemeColors } from '@/theme/tokens';
import { HapticService } from '@/services/hapticsService';

interface ConfirmStopModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
}

export const ConfirmStopModal: React.FC<ConfirmStopModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  colors,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Stop Session?</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Stopping will cancel this session and reset the timer. This action cannot be undone.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
              onPress={() => {
                HapticService.buttonPress();
                onCancel();
              }}
            >
              <Text style={[styles.btnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.danger }]}
              onPress={() => {
                HapticService.buttonPress();
                onConfirm();
              }}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                Stop Session
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
    padding: 20,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
