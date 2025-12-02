// src/screens/TasksScreen.tsx
import React, { useMemo, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import { useTasks } from '../context/TasksContext';
import { usePrefs } from '../context/PrefsContext';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { Task, TaskStatus } from '../models/Task';
import { User } from '../models/User';

type Tab = 'tasks' | 'schedule';
type TasksViewMode = 'me' | 'team';

const TasksScreen: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { tasks, loading, createTask, updateTaskStatus } = useTasks();
  const { users, groups, visibleGroups } = useGroups();
  const { fontSize } = usePrefs();

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [tasksViewMode, setTasksViewMode] = useState<TasksViewMode>('me');
  const [showAllSchedule, setShowAllSchedule] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(
    null
  );
  const [creating, setCreating] = useState<boolean>(false);

  if (!user) {
    return null;
  }

  // Люди з моїх груп (для user/manager)
  const myGroupIds = useMemo(
    () => user.groupIds ?? [],
    [user.groupIds]
  );

  const teammates: User[] = useMemo(() => {
    if (isAdmin) {
      // адмін як "zespół" має всіх
      return users.filter(u => u.id !== user.id);
    }
    // всі, хто має хоча б одну спільну групу зі мною
    const setIds = new Set<string>();
    return users.filter(u => {
      if (u.id === user.id) return false;
      const common = u.groupIds?.some(gId => myGroupIds.includes(gId));
      if (!common) return false;
      if (setIds.has(u.id)) return false;
      setIds.add(u.id);
      return true;
    });
  }, [users, user.id, myGroupIds, isAdmin]);

  // Завдання (type='task')
  const taskItems: Task[] = useMemo(() => {
    const onlyTasks = tasks.filter(t => t.type === 'task');

    if (tasksViewMode === 'me' || (!isManager && !isAdmin)) {
      // завжди "Moje zadania" для звичайного юзера
      return onlyTasks.filter(t => t.assignedToId === user.id);
    }

    // 'team' mode для manager/admin
    if (isAdmin) {
      return onlyTasks;
    }

    // manager: задачі людей із його груп
    const teamIds = new Set(teammates.map(t => t.id));
    return onlyTasks.filter(t =>
      t.assignedToId ? teamIds.has(t.assignedToId) : false
    );
  }, [tasks, user.id, tasksViewMode, isManager, isAdmin, teammates]);

  // Зміни (type='shift')
  const shiftItems: Task[] = useMemo(() => {
    const shifts = tasks.filter(t => t.type === 'shift');

    // Якщо не показуємо всіх — тільки мій графік
    if (!showAllSchedule) {
      return shifts.filter(t => t.assignedToId === user.id);
    }

    if (isAdmin) {
      return shifts;
    }

    // Показати графік всіх людей з моїх груп
    const teamIds = new Set<string>(teammates.map(t => t.id));
    teamIds.add(user.id);
    return shifts.filter(t =>
      t.assignedToId ? teamIds.has(t.assignedToId) : false
    );
  }, [tasks, user.id, showAllSchedule, isAdmin, teammates]);

  const cycleStatus = (current?: TaskStatus): TaskStatus => {
    if (!current || current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'done';
    return 'todo';
  };

  const handleToggleStatus = async (task: Task) => {
    if (!task.assignedToId) return;

    // user може змінювати тільки свої задачі
    const isMine = task.assignedToId === user.id;

    if (!isMine && !isManager && !isAdmin) {
      Alert.alert('Brak uprawnień', 'Możesz zmieniać tylko swoje zadania.');
      return;
    }

    const nextStatus = cycleStatus(task.status);
    try {
      await updateTaskStatus(task.id, nextStatus);
    } catch (e: any) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować zadania.');
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł zadania.');
      return;
    }

    let assignedToId = user.id;

    if ((isManager || isAdmin) && selectedAssigneeId) {
      assignedToId = selectedAssigneeId;
    }

    setCreating(true);
    try {
      await createTask(
        {
          type: 'task',
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          assignedToId,
          // на демо можна не вказувати groupId/company,
          // або взяти першу групу користувача
          groupId: user.groupIds[0],
          company: user.companyIds[0],
        },
        user.id
      );
      setNewTitle('');
      setNewDescription('');
      setSelectedAssigneeId(null);
    } catch (e: any) {
      Alert.alert('Błąd', 'Nie udało się utworzyć zadania.');
    } finally {
      setCreating(false);
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const assignee = users.find(u => u.id === item.assignedToId);
    const isMine = item.assignedToId === user.id;

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          isMine && styles.taskCardMine,
          item.status === 'done' && styles.taskCardDone,
        ]}
        onPress={() => handleToggleStatus(item)}
      >
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              { fontSize: scaleFont(14, fontSize) },
            ]}
          >
            {item.title}
          </Text>
          {item.status && (
            <Text
              style={[
                styles.statusBadge,
                styles[`status_${item.status}` as keyof typeof styles],
                { fontSize: scaleFont(10, fontSize) },
              ]}
            >
              {item.status === 'todo'
                ? 'TODO'
                : item.status === 'in_progress'
                ? 'W TOKU'
                : 'ZROBIONE'}
            </Text>
          )}
        </View>
        {item.description ? (
          <Text
            style={[
              styles.taskDescription,
              { fontSize: scaleFont(12, fontSize) },
            ]}
          >
            {item.description}
          </Text>
        ) : null}
        <Text
          style={[
            styles.taskMeta,
            { fontSize: scaleFont(10, fontSize) },
          ]}
        >
          {assignee
            ? `Przypisane do: ${assignee.name}`
            : 'Brak przypisanego użytkownika'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderShiftItem = ({ item }: { item: Task }) => {
    const assignee = users.find(u => u.id === item.assignedToId);
    const start = item.startTime
      ? new Date(item.startTime).toLocaleString()
      : '';
    const end = item.endTime
      ? new Date(item.endTime).toLocaleTimeString()
      : '';

    return (
      <View style={styles.shiftCard}>
        <Text
          style={[
            styles.shiftTitle,
            { fontSize: scaleFont(13, fontSize) },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.shiftMeta,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          {assignee ? assignee.name : 'Nieznany użytkownik'}
        </Text>
        <Text
          style={[
            styles.shiftMeta,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          {start} - {end}
        </Text>
        {item.company && (
          <Text
            style={[
              styles.shiftMeta,
              { fontSize: scaleFont(11, fontSize) },
            ]}
          >
            Firma: {item.company}
          </Text>
        )}
      </View>
    );
  };

  const showTasksTab = activeTab === 'tasks';

  return (
    <Screen>
      <View style={styles.container}>
        {/* Заголовок + таби */}
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Zadania i grafik
        </Text>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('tasks')}
            style={[
              styles.tab,
              showTasksTab && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  fontSize: scaleFont(13, fontSize),
                  color: showTasksTab ? '#0b1120' : colors.text,
                },
              ]}
            >
              Zadania
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('schedule')}
            style={[
              styles.tab,
              !showTasksTab && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  fontSize: scaleFont(13, fontSize),
                  color: !showTasksTab ? '#0b1120' : colors.text,
                },
              ]}
            >
              Grafik
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {showTasksTab ? (
          <>
            {/* Перемикач "Moje / Zespół" для manager/admin */}
            {(isManager || isAdmin) && (
              <View style={styles.switchRow}>
                <TouchableOpacity
                  style={[
                    styles.switchChip,
                    tasksViewMode === 'me' && styles.switchChipActive,
                  ]}
                  onPress={() => setTasksViewMode('me')}
                >
                  <Text
                    style={[
                      styles.switchText,
                      {
                        fontSize: scaleFont(11, fontSize),
                        color:
                          tasksViewMode === 'me'
                            ? '#0b1120'
                            : colors.text,
                      },
                    ]}
                  >
                    Moje zadania
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.switchChip,
                    tasksViewMode === 'team' && styles.switchChipActive,
                  ]}
                  onPress={() => setTasksViewMode('team')}
                >
                  <Text
                    style={[
                      styles.switchText,
                      {
                        fontSize: scaleFont(11, fontSize),
                        color:
                          tasksViewMode === 'team'
                            ? '#0b1120'
                            : colors.text,
                      },
                    ]}
                  >
                    Zespół
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Список задач */}
            <FlatList
              data={taskItems}
              keyExtractor={t => t.id}
              renderItem={renderTaskItem}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    { fontSize: scaleFont(13, fontSize) },
                  ]}
                >
                  Brak zadań do wyświetlenia.
                </Text>
              }
              contentContainerStyle={{ paddingVertical: 8 }}
            />

            {/* Форма додавання задачі */}
            <View style={styles.newTaskContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: scaleFont(15, fontSize) },
                ]}
              >
                Dodaj zadanie
              </Text>
              {(isManager || isAdmin) && (
                <View style={styles.assigneeRow}>
                  <Text
                    style={[
                      styles.assigneeLabel,
                      { fontSize: scaleFont(11, fontSize) },
                    ]}
                  >
                    Przypisz do:
                  </Text>
                  <FlatList
                    horizontal
                    data={teammates}
                    keyExtractor={u => u.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    renderItem={({ item }) => {
                      const selected = item.id === selectedAssigneeId;
                      return (
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedAssigneeId(
                              selected ? null : item.id
                            )
                          }
                          style={[
                            styles.assigneeChip,
                            selected && styles.assigneeChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.assigneeChipText,
                              {
                                fontSize: scaleFont(11, fontSize),
                                color: selected
                                  ? '#0b1120'
                                  : colors.text,
                              },
                            ]}
                          >
                            {item.name.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}

              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(13, fontSize) },
                ]}
                placeholder="Tytuł zadania"
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  { fontSize: scaleFont(13, fontSize) },
                ]}
                placeholder="Opis (opcjonalnie)"
                placeholderTextColor={colors.textMuted}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.addButton,
                  creating && { opacity: 0.6 },
                ]}
                onPress={handleCreateTask}
                disabled={creating}
              >
                <Text
                  style={[
                    styles.addButtonText,
                    { fontSize: scaleFont(14, fontSize) },
                  ]}
                >
                  {creating ? 'Zapisywanie...' : 'Dodaj zadanie'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Grafik */}
            <View style={styles.switchRow}>
              <TouchableOpacity
                style={[
                  styles.switchChip,
                  !showAllSchedule && styles.switchChipActive,
                ]}
                onPress={() => setShowAllSchedule(false)}
              >
                <Text
                  style={[
                    styles.switchText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: !showAllSchedule
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  Mój grafik
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.switchChip,
                  showAllSchedule && styles.switchChipActive,
                ]}
                onPress={() => setShowAllSchedule(true)}
              >
                <Text
                  style={[
                    styles.switchText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: showAllSchedule
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  Grafik wszystkich
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={shiftItems}
              keyExtractor={t => t.id}
              renderItem={renderShiftItem}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    { fontSize: scaleFont(13, fontSize) },
                  ]}
                >
                  Brak zmian do wyświetlenia.
                </Text>
              }
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </>
        )}
      </View>
    </Screen>
  );
};

export default TasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.text,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  switchChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  switchChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  switchText: {
    color: colors.text,
    fontWeight: '500',
  },

  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },

  // tasks
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  taskCardMine: {
    borderColor: colors.accent,
  },
  taskCardDone: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    color: colors.text,
    marginTop: 4,
  },
  taskMeta: {
    color: colors.textMuted,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
  status_todo: {
    backgroundColor: '#f97316',
    color: '#0b1120',
  },
  status_in_progress: {
    backgroundColor: '#22c55e',
    color: '#0b1120',
  },
  status_done: {
    backgroundColor: '#38bdf8',
    color: '#0b1120',
  },

  newTaskContainer: {
    marginTop: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  assigneeRow: {
    marginBottom: 6,
  },
  assigneeLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  assigneeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  assigneeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  assigneeChipText: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginBottom: 6,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },

  // shifts
  shiftCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  shiftTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  shiftMeta: {
    color: colors.textMuted,
    marginTop: 2,
  },
});
