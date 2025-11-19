// src/screens/TasksScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';
import { Task } from '../models/Task';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

type Tab = 'tasks' | 'schedule';

const TasksScreen: React.FC = () => {
  const { fontSize } = usePrefs();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Task[]>('/tasks');
      setTasks(data);
    })();
  }, []);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        t =>
          t.type === 'task' &&
          (!user?.id || !t.assignedToId || t.assignedToId === user.id) &&
          t.title.toLowerCase().includes(search.toLowerCase())
      ),
    [tasks, search, user]
  );

  const filteredSchedule = useMemo(
    () =>
      tasks.filter(
        t =>
          t.type === 'shift' &&
          t.title.toLowerCase().includes(search.toLowerCase())
      ),
    [tasks, search]
  );

  const onAddTask = () => {
    Alert.alert('Mock', 'Dodawanie zadania jeszcze niezaimplementowane');
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <Text style={[styles.taskTitle, { fontSize: scaleFont(16, fontSize) }]}>
        {item.title}
      </Text>
      {item.description && (
        <Text
          style={[
            styles.taskDescription,
            { fontSize: scaleFont(12, fontSize) },
          ]}
        >
          {item.description}
        </Text>
      )}
      {item.status && (
        <Text
          style={[
            styles.status,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Status: {item.status}
        </Text>
      )}
    </View>
  );

  const renderShift = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <Text style={[styles.taskTitle, { fontSize: scaleFont(16, fontSize) }]}>
        {item.title}
      </Text>
      <Text
        style={[
          styles.taskDescription,
          { fontSize: scaleFont(12, fontSize) },
        ]}
      >
        {item.company}
      </Text>
      {item.startTime && item.endTime && (
        <Text
          style={[
            styles.status,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          {new Date(item.startTime).toLocaleString()} -{' '}
          {new Date(item.endTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Zadania i grafiki
        </Text>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === 'tasks' && styles.tabActive,
            ]}
            onPress={() => setTab('tasks')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'tasks' && styles.tabTextActive,
                { fontSize: scaleFont(13, fontSize) },
              ]}
            >
              Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === 'schedule' && styles.tabActive,
            ]}
            onPress={() => setTab('schedule')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'schedule' && styles.tabTextActive,
                { fontSize: scaleFont(13, fontSize) },
              ]}
            >
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search + add */}
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              { fontSize: scaleFont(13, fontSize) },
            ]}
            placeholder="Szukaj..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.addButton} onPress={onAddTask}>
            <Text
              style={[
                styles.addButtonText,
                { fontSize: scaleFont(13, fontSize) },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tab === 'tasks' ? filteredTasks : filteredSchedule}
          keyExtractor={t => t.id}
          renderItem={tab === 'tasks' ? renderTask : renderShift}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </View>
    </Screen>
  );
};

export default TasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 999,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
  },
  tabText: {
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#0b1120',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    marginRight: 8,
  },
  addButton: {
    width: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#0b1120',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    color: colors.textMuted,
  },
  status: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
