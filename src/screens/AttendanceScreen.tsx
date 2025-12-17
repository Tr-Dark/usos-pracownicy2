// src/screens/AttendanceScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import { useNetwork } from '../context/NetworkContext';

type Attendance = {
  id: string;
  userId: string;
  scannedValue: string;
  timestamp: string;
};

const demoQr = (userId: string) =>
  `USOS|ATTENDANCE|user=${userId}|ts=${new Date().toISOString()}`;

export default function AttendanceScreen() {
  const { fontSize } = usePrefs();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();

  const offline = !isConnected || !isInternetReachable;

  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [scanning, setScanning] = useState(false);

  const canScan = useMemo(() => {
    return Boolean(user) && !saving && !cooldown;
  }, [user, saving, cooldown]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  const saveAttendance = async (value: string) => {
    if (!user) return;

    if (offline) {
      Alert.alert(
        'Brak internetu',
        'Nie można zapisać obecności bez internetu!'
      );
      return;
    }

    try {
      setSaving(true);

      const payload: Attendance = {
        id: Date.now().toString(),
        userId: user.id,
        scannedValue: value,
        timestamp: new Date().toISOString(),
      };

      await api.post('/attendance', payload);

      setLastScan(value);
      Alert.alert('Sukces', 'Obecność zarejestrowana ✅');
    } catch (e) {
      console.warn('saveAttendance failed', e);
      Alert.alert('Błąd', 'Nie udało się zapisać obecności');
    } finally {
      setSaving(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 1500);
    }
  };

  const startScan = () => {
    if (saving) return;

    if (!user) {
      Alert.alert('Błąd', 'Zaloguj się najpierw');
      return;
    }

    setLastScan('');
    setScanning(true);

    setTimeout(() => {
      setScanning(prev => {
        if (prev) {
          Alert.alert(
            'Nie znaleziono QR',
            'Spróbuj ponownie i ustaw kod QR w kadrze.'
          );
        }
        return false;
      });
    }, 8000);
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning || !canScan) return;

    setScanning(false);
    saveAttendance(data);
  };

  if (!permission) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.text, { fontSize: scaleFont(14, fontSize) }]}>
            Ładowanie uprawnień kamery...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.text, { fontSize: scaleFont(14, fontSize) }]}>
            Brak dostępu do kamery.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={[styles.primaryBtnText, { fontSize: scaleFont(13, fontSize) }]}>
              Przyznaj uprawnienia
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(18, fontSize) }]}>
          Rejestracja obecności (QR)
        </Text>

        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={'back' as CameraType}
            onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { fontSize: scaleFont(12, fontSize) }]}>
              {scanning ? 'Skanowanie... ustaw QR w kadrze' : 'Naciśnij "Skanuj QR" i ustaw QR w kadrze'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Ostatni skan:
          </Text>
          <Text
            style={[styles.value, { fontSize: scaleFont(12, fontSize) }]}
            numberOfLines={2}
          >
            {lastScan || '—'}
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (saving || !user) && { opacity: 0.7 },
            ]}
            disabled={saving || !user}
            onPress={startScan}
          >
            <Text style={[styles.primaryBtnText, { fontSize: scaleFont(13, fontSize) }]}>
              {scanning ? 'Skanowanie...' : 'Skanuj QR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (!user || saving) && { opacity: 0.7 },
            ]}
            disabled={!user || saving}
            onPress={() => user && saveAttendance(demoQr(user.id))}
          >
            <Text style={[styles.secondaryBtnText, { fontSize: scaleFont(13, fontSize) }]}>
              Symuluj skan (demo)
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { color: colors.text, fontWeight: '700', marginBottom: 10 },

  cameraWrap: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0b1220',
  },
  overlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(2,6,23,0.75)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlayText: { color: colors.text, textAlign: 'center' },

  card: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, marginBottom: 4 },
  value: { color: colors.text, marginBottom: 10 },

  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0b1120', fontWeight: '700' },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.text, fontWeight: '700' },

  hint: { marginTop: 10, color: colors.textMuted },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: colors.text, textAlign: 'center', marginBottom: 10 },
});
