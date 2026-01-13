import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';

export default function WelfareCheckPrompt({ visible, onResponse }) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent back button from closing
    >
      <View style={styles.overlay}>
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>WELFARE CHECK</Text>
          <Text style={styles.promptMessage}>Status check: Are you okay?</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.okButton]}
              onPress={() => onResponse('ok')}
            >
              <Text style={styles.buttonText}>I'M OK</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.backupButton]}
              onPress={() => onResponse('need_backup')}
            >
              <Text style={styles.buttonText}>NEED BACKUP</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.timerText}>30 seconds remaining...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptContainer: {
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#FFAA00',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFAA00',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  promptMessage: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '700',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#00AA00',
  },
  backupButton: {
    backgroundColor: '#FFAA00',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  timerText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 20,
    fontFamily: 'monospace',
  },
});
