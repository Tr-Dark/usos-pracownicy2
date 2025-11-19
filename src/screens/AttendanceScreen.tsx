// src/screens/AttendanceScreen.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';

const AttendanceScreen: React.FC = () => {
  const { fontSize } = usePrefs();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const onRegister = () => {
    Alert.alert('Mock', 'Rejestracja obecności (mock)');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Rejestracja obecności
        </Text>

        <View style={styles.cameraPlaceholder}>
          <Text
            style={[
              styles.placeholderText,
              { fontSize: scaleFont(16, fontSize) },
            ]}
          >
            Camera placeholder
          </Text>
        </View>

        <Text style={[styles.time, { fontSize: scaleFont(24, fontSize) }]}>
          {now.toLocaleTimeString()}
        </Text>

        <TouchableOpacity style={styles.button} onPress={onRegister}>
          <Text
            style={[
              styles.buttonText,
              { fontSize: scaleFont(16, fontSize) },
            ]}
          >
            Zarejestruj
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 16,
  },
  cameraPlaceholder: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
  },
  time: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
