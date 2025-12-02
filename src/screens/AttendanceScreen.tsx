// src/screens/AttendanceScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { api } from '../api/api';
import { Attendance } from '../models/Attendance';
import { useGroups } from '../context/GroupsContext';

const AttendanceScreen: React.FC = () => {
  const { user } = useAuth();
  const { fontSize } = usePrefs();
  const { visibleGroups } = useGroups();

  const [now, setNow] = useState<Date>(new Date());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadAttendance = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Attendance[]>('/attendance', {
          params: {
            userId: user.id,
            _sort: 'timestamp',
            _order: 'desc',
          },
        });
        setRecords(data);
      } catch (e) {
        console.warn('Failed to load attendance', e);
        Alert.alert('Błąd', 'Nie udało się pobrać obecności.');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [user?.id]);

  if (!user) return null;

  const handleCheckIn = async () => {
    if (saving) return;

    const timestamp = new Date().toISOString();
    const groupId = visibleGroups[0]?.id;

    const newRecord: Attendance = {
      id: Date.now().toString(),
      userId: user.id,
      timestamp,
      type: 'check',
      groupId,
    };

    try {
      setSaving(true);
      const { data } = await api.post<Attendance>('/attendance', newRecord);
      setRecords(prev => [data, ...prev]);
    } catch (e) {
      console.warn('Failed to add attendance', e);
      Alert.alert('Błąd', 'Nie udało się zarejestrować obecności.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Attendance }) => {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();

    return (
      <View style={styles.recordCard}>
        <Text
          style={[
            styles.recordText,
            { fontSize: scaleFont(13, fontSize) },
          ]}
        >
          {dateStr} • {timeStr}
        </Text>
        <Text
          style={[
            styles.recordSub,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Typ: check-in
        </Text>
      </View>
    );
  };

  const nowDate = now.toLocaleDateString();
  const nowTime = now.toLocaleTimeString();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Rejestracja obecności
        </Text>

        <View style={styles.cameraPlaceholder}>
          <Text
            style={[
              styles.cameraText,
              { fontSize: scaleFont(13, fontSize) },
            ]}
          >
            Podgląd kamery (placeholder)
          </Text>
        </View>

        <View style={styles.timeBox}>
          <Text
            style={[
              styles.timeLabel,
              { fontSize: scaleFont(12, fontSize) },
            ]}
          >
            Aktualny czas
          </Text>
          <Text
            style={[
              styles.timeValue,
              { fontSize: scaleFont(18, fontSize) },
            ]}
          >
            {nowDate} • {nowTime}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.7 }]}
          onPress={handleCheckIn}
          disabled={saving}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize: scaleFont(15, fontSize) },
            ]}
          >
            {saving ? 'Rejestruję...' : 'Zarejestruj'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.sectionTitle,
            { fontSize: scaleFont(14, fontSize) },
          ]}
        >
          Ostatnie rejestracje
        </Text>

        <FlatList
          data={records}
          keyExtractor={r => r.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 4 }}
          ListEmptyComponent={() =>
            !loading ? (
              <Text
                style={[
                  styles.emptyText,
                  { fontSize: scaleFont(12, fontSize) },
                ]}
              >
                Brak zarejestrowanej obecności.
              </Text>
            ) : null
          }
        />
      </View>
    </Screen>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  cameraPlaceholder: {
    height: 160,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cameraText: {
    color: colors.textMuted,
  },
  timeBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  timeLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  timeValue: {
    color: colors.text,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 6,
  },
  recordText: {
    color: colors.text,
  },
  recordSub: {
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
