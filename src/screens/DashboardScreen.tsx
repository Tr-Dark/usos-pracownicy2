// src/screens/DashboardScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useMessages } from '../context/MessagesContext';
import { useGroups } from '../context/GroupsContext';
import { usePrefs } from '../context/PrefsContext';
import { getColors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { Task } from '../models/Task';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, fontSize } = usePrefs() as any;
  const c = getColors(darkMode);

  const { tasks, refresh: refreshTasks, loading: loadingTasks } = useTasks();
  const { messages, refreshMessages, loading: loadingMessages } = useMessages();
  const { users, visibleGroups } = useGroups();

  const navigation = useNavigation<any>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) return null;

  const userRolesLabel = useMemo(
    () =>
      (user.roles || [])
        .map(r => (r === 'admin' ? 'Admin' : r === 'manager' ? 'Manager' : 'User'))
        .join(', '),
    [user.roles]
  );

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.allSettled([refreshTasks(), refreshMessages()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const myOpenTasks: Task[] = useMemo(
    () =>
      tasks
        .filter(t => t.type === 'task' && t.assignedToId === user.id && t.status !== 'done')
        .slice(0, 5),
    [tasks, user.id]
  );

  const myShifts: Task[] = useMemo(
    () => tasks.filter(t => t.type === 'shift' && t.assignedToId === user.id).slice(0, 3),
    [tasks, user.id]
  );

  const myMessages: (Message & { other?: User })[] = useMemo(() => {
    const myMsgs = messages
      .filter(m => m.fromUserId === user.id || m.toUserId === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return myMsgs.map(m => {
      const otherId = m.fromUserId === user.id ? m.toUserId : m.fromUserId;
      const other = users.find(u => u.id === otherId);
      return { ...m, other };
    });
  }, [messages, user.id, users]);

  const goToTasks = () => navigation.navigate('Tasks');
  const goToMessages = () => navigation.navigate('Messages');
  const goToAttendance = () => navigation.navigate('Attendance');

  const refreshing = isRefreshing || loadingTasks || loadingMessages;

  return (
    <Screen>
      <ScrollView
        style={[styles.container, { backgroundColor: c.background }]}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
      >
        {/* Powitanie + role */}
        <View style={[styles.headerCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.greeting, { fontSize: scaleFont(20, fontSize), color: c.text }]}>
            Cześć, {user.name.split(' ')[0]} 👋
          </Text>

          <Text style={[styles.subGreeting, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
            Stanowisko: {user.position || '—'}
          </Text>

          <Text style={[styles.subGreeting, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
            Rola: {userRolesLabel || 'user'}
          </Text>

          {visibleGroups.length > 0 && (
            <Text style={[styles.subGreeting, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
              Grupy: {visibleGroups.map(g => g.name).join(', ')}
            </Text>
          )}
        </View>

        {/* Szybkie akcje */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={[styles.quickButton, { backgroundColor: c.accent }]} onPress={goToTasks}>
            <Text style={[styles.quickButtonText, { fontSize: scaleFont(13, fontSize) }]}>
              Moje zadania
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickButton, { backgroundColor: c.accent }]} onPress={goToMessages}>
            <Text style={[styles.quickButtonText, { fontSize: scaleFont(13, fontSize) }]}>
              Wiadomości
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickButton, { backgroundColor: c.accent }]} onPress={goToAttendance}>
            <Text style={[styles.quickButtonText, { fontSize: scaleFont(13, fontSize) }]}>
              Obecność
            </Text>
          </TouchableOpacity>
        </View>

        {/* Blok: zadania */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { fontSize: scaleFont(15, fontSize), color: c.text }]}>
              Otwarte zadania
            </Text>
            <TouchableOpacity onPress={goToTasks}>
              <Text style={[styles.cardLink, { fontSize: scaleFont(11, fontSize), color: c.accent }]}>
                Zobacz wszystkie
              </Text>
            </TouchableOpacity>
          </View>

          {myOpenTasks.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
              Brak otwartych zadań.
            </Text>
          ) : (
            <FlatList
              data={myOpenTasks}
              keyExtractor={t => t.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.taskRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.taskTitle, { fontSize: scaleFont(13, fontSize), color: c.text }]}>
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text
                        style={[styles.taskDesc, { fontSize: scaleFont(11, fontSize), color: c.textMuted }]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>

                  {item.status && (
                    <Text
                      style={[
                        styles.taskStatus,
                        { fontSize: scaleFont(10, fontSize), backgroundColor: c.accent },
                      ]}
                    >
                      {item.status === 'todo' ? 'TODO' : item.status === 'in_progress' ? 'W TOKU' : 'ZROBIONE'}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </View>

        {/* Blok: grafik */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { fontSize: scaleFont(15, fontSize), color: c.text }]}>
              Twój grafik
            </Text>
            <TouchableOpacity onPress={goToTasks}>
              <Text style={[styles.cardLink, { fontSize: scaleFont(11, fontSize), color: c.accent }]}>
                Grafik wszystkich
              </Text>
            </TouchableOpacity>
          </View>

          {myShifts.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
              Brak przypisanych zmian.
            </Text>
          ) : (
            <FlatList
              data={myShifts}
              keyExtractor={s => s.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const start = item.startTime ? new Date(item.startTime).toLocaleString() : '';
                const end = item.endTime ? new Date(item.endTime).toLocaleTimeString() : '';
                return (
                  <View style={styles.shiftRow}>
                    <Text style={[styles.shiftTitle, { fontSize: scaleFont(13, fontSize), color: c.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.shiftTime, { fontSize: scaleFont(11, fontSize), color: c.textMuted }]}>
                      {start} {end ? `– ${end}` : ''}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Blok: wiadomości */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { fontSize: scaleFont(15, fontSize), color: c.text }]}>
              Ostatnie wiadomości
            </Text>
            <TouchableOpacity onPress={goToMessages}>
              <Text style={[styles.cardLink, { fontSize: scaleFont(11, fontSize), color: c.accent }]}>
                Otwórz czat
              </Text>
            </TouchableOpacity>
          </View>

          {myMessages.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: scaleFont(12, fontSize), color: c.textMuted }]}>
              Brak wiadomości.
            </Text>
          ) : (
            <FlatList
              data={myMessages}
              keyExtractor={m => m.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.msgRow}>
                  <Text
                    style={[styles.msgWho, { fontSize: scaleFont(12, fontSize), color: c.text }]}
                    numberOfLines={1}
                  >
                    {item.other ? item.other.name : 'Nieznany użytkownik'}
                  </Text>
                  <Text
                    style={[styles.msgText, { fontSize: scaleFont(11, fontSize), color: c.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.text}
                  </Text>
                  <Text style={[styles.msgTime, { fontSize: scaleFont(10, fontSize), color: c.textMuted }]}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  greeting: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subGreeting: {},
  quickRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  quickButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  quickButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: '600',
  },
  cardLink: {},
  emptyText: {},
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskDesc: {},
  taskStatus: {
    color: '#0b1120',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    fontWeight: '600',
  },
  shiftRow: {
    marginBottom: 4,
  },
  shiftTitle: {
    fontWeight: '500',
  },
  shiftTime: {},
  msgRow: {
    marginBottom: 4,
  },
  msgWho: {
    fontWeight: '500',
  },
  msgText: {},
  msgTime: {},
});
