// src/screens/AttendanceScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

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
  company: string;
  startTime: string;
  endTime?: string | null;
  active: boolean;
};

type ParsedQr = {
  company: string;
};

// Format HH:MM:SS
const formatHMS = (secondsTotal: number) => {
  const s = Math.max(0, Math.floor(secondsTotal));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
};

/**
 * USOS|ATT|company=BlueMarketing
 */
const parseCompanyFromQr = (data: string): ParsedQr | null => {
  const raw = (data || '').trim();
  if (!raw) return null;

  // USOS|ATT|company=XXX
  if (raw.startsWith('USOS|ATT|')) {
    const parts = raw.split('|');
    const companyPart = parts.find(p => p.startsWith('company='));
    const company = companyPart?.split('=')[1]?.trim();
    if (company) return { company };
    return null;
  }

  return { company: raw };
};

const demoQr = (company: string) => `USOS|ATT|company=${company}`;

export default function AttendanceScreen() {
  const { fontSize } = usePrefs();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isFocused = useIsFocused();

  const offline = !isConnected || !isInternetReachable;

  const [permission, requestPermission] = useCameraPermissions();

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const [activeAttendance, setActiveAttendance] = useState<Attendance | null>(
    null
  );

  const [lastCompany, setLastCompany] = useState<string>('');
  const [timerText, setTimerText] = useState('00:00:00');

  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLockRef = useRef(false);

  const stopScanTimeout = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const canScan = useMemo(() => {
    return Boolean(user) && !saving && !cooldown && !activeAttendance;
  }, [user, saving, cooldown, activeAttendance]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    if (!isFocused) {
      setScanning(false);
      stopScanTimeout();
    }
  }, [isFocused]);

  const loadActiveAttendance = async () => {
    if (!user) return;
    try {
      const { data } = await api.get<Attendance[]>(
        `/attendance?userId=${user.id}&active=true&_sort=startTime&_order=desc`
      );
      const last = data?.[0] ?? null;
      setActiveAttendance(last);
      setLastCompany(last?.company ?? '');
    } catch (e) {
      console.warn('loadActiveAttendance failed', e);
    }
  };

  useEffect(() => {
    loadActiveAttendance();
  }, [user?.id]);

  useEffect(() => {
    if (!activeAttendance?.startTime) {
      setTimerText('00:00:00');
      return;
    }

    const tick = () => {
      const startMs = Date.parse(activeAttendance.startTime);
      const nowMs = Date.now();
      const sec = Math.floor((nowMs - startMs) / 1000);
      setTimerText(formatHMS(sec));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeAttendance?.startTime]);

  const startAttendance = async (company: string) => {
    if (!user) return;

    if (offline) {
      Alert.alert('Brak internetu', 'Nie można rozpocząć pracy bez internetu.');
      return;
    }

    try {
      setSaving(true);

      const { data: existing } = await api.get<Attendance[]>(
        `/attendance?userId=${user.id}&active=true`
      );
      if (existing?.length) {
        setActiveAttendance(existing[0]);
        setLastCompany(existing[0].company);
        Alert.alert('Informacja', 'Masz już aktywną zmianę.');
        return;
      }

      const payload: Attendance = {
        id: Date.now().toString(),
        userId: user.id,
        company,
        startTime: new Date().toISOString(),
        endTime: null,
        active: true,
      };

      const { data } = await api.post<Attendance>('/attendance', payload);

      setActiveAttendance(data);
      setLastCompany(company);

      Alert.alert('Sukces', `Start pracy zapisany ✅\nFirma: ${company}`);
    } catch (e) {
      console.warn('startAttendance failed', e);
      Alert.alert('Błąd', 'Nie udało się rozpocząć pracy.');
    } finally {
      setSaving(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 1200);
    }
  };

  const stopAttendance = async () => {
    if (!user) return;
    if (!activeAttendance) return;

    if (offline) {
      Alert.alert('Brak internetu', 'Nie można zakończyć pracy bez internetu.');
      return;
    }

    try {
      setSaving(true);

      const patch = {
        endTime: new Date().toISOString(),
        active: false,
      };

      const { data } = await api.patch<Attendance>(
        `/attendance/${activeAttendance.id}`,
        patch
      );

      Alert.alert(
        'Sukces',
        `Stop pracy zapisany ✅\nFirma: ${data.company}`
      );

      setActiveAttendance(null);
      setTimerText('00:00:00');
    } catch (e) {
      console.warn('stopAttendance failed', e);
      Alert.alert('Błąd', 'Nie udało się zakończyć pracy.');
    } finally {
      setSaving(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 1200);
    }
  };

  const startScan = () => {
    if (saving) return;

    if (!user) {
      Alert.alert('Błąd', 'Zaloguj się najpierw.');
      return;
    }

    if (activeAttendance) {
      Alert.alert('Informacja', 'Masz aktywną zmianę. Użyj STOP.');
      return;
    }

    if (!isFocused) return;

    setScanning(true);

    stopScanTimeout();
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(prev => {
        if (prev) {
          Alert.alert('Nie znaleziono QR', 'Spróbuj ponownie i ustaw kod w kadrze.');
        }
        return false;
      });
    }, 8000);
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
  if (scanLockRef.current) return;

  if (!scanning || !canScan) return;

  scanLockRef.current = true; 
  stopScanTimeout();
  setScanning(false);

  const parsed = parseCompanyFromQr(data);
  if (!parsed?.company) {
    scanLockRef.current = false; 
    Alert.alert('Błąd', 'Niepoprawny kod QR (brak company).');
    return;
  }

  Promise.resolve()
    .then(() => startAttendance(parsed.company))
    .finally(() => {
      setTimeout(() => {
        scanLockRef.current = false;
      }, 1200);
    });
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
          {isFocused && scanning ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing={'back' as CameraType}
              onBarcodeScanned={onBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={[styles.placeholderText, { fontSize: scaleFont(12, fontSize) }]}>
                {activeAttendance
                  ? 'Zmiana aktywna — kamera wyłączona'
                  : 'Kamera jest wyłączona. Naciśnij „Skanuj QR”.'}
              </Text>
            </View>
          )}

          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { fontSize: scaleFont(12, fontSize) }]}>
              {activeAttendance
                ? 'Zmiana aktywna — naciśnij STOP'
                : scanning
                ? 'Skanowanie... ustaw QR w kadrze'
                : 'Naciśnij "Skanuj QR" i ustaw QR w kadrze'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Firma:
          </Text>
          <Text style={[styles.value, { fontSize: scaleFont(13, fontSize) }]}>
            {activeAttendance?.company || lastCompany || '—'}
          </Text>

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize), marginTop: 8 }]}>
            Czas pracy:
          </Text>
          <Text style={[styles.timer, { fontSize: scaleFont(18, fontSize) }]}>
            {activeAttendance ? timerText : '00:00:00'}
          </Text>

          {!activeAttendance ? (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, (saving || !user || offline) && { opacity: 0.7 }]}
                disabled={saving || !user || offline}
                onPress={startScan}
              >
                <Text style={[styles.primaryBtnText, { fontSize: scaleFont(13, fontSize) }]}>
                  {scanning ? 'Skanowanie...' : 'Skanuj QR (START)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, (!user || saving) && { opacity: 0.7 }]}
                disabled={!user || saving}
                onPress={() => startAttendance('BlueMarketing')}
              >
                <Text style={[styles.secondaryBtnText, { fontSize: scaleFont(13, fontSize) }]}>
                  Symuluj skan (demo)
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.stopBtn, (saving || offline) && { opacity: 0.7 }]}
                disabled={saving || offline}
                onPress={stopAttendance}
              >
                <Text style={[styles.stopBtnText, { fontSize: scaleFont(13, fontSize) }]}>
                  STOP (zapisz koniec)
                </Text>
              </TouchableOpacity>
            </>
          )}

          {offline && (
            <Text style={[styles.offlineText, { fontSize: scaleFont(11, fontSize) }]}>
              Brak internetu — nie da się zapisać START/STOP w bazie.
            </Text>
          )}
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
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  placeholderText: {
    color: colors.textMuted,
    textAlign: 'center',
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
  value: { color: colors.text, fontWeight: '700' },

  timer: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0b1120', fontWeight: '700' },

  stopBtn: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopBtnText: { color: '#0b1120', fontWeight: '900' },

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
  offlineText: { marginTop: 10, color: '#f59e0b', fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: colors.text, textAlign: 'center', marginBottom: 10 },
});
