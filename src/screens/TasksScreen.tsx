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
import { useTasks } from '../context/TasksContext';
import { usePrefs } from '../context/PrefsContext';
import { useGroups } from '../context/GroupsContext';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { Task, TaskPriority, TaskStatus } from '../models/Task';
import { User } from '../models/User';

type MainTab = 'tasks' | 'schedule';
type ScheduleScope = 'mine' | 'all';

const priorityWeight: Record<TaskPriority | 'none', number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

const TasksScreen: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { tasks, updateTask, createTask } = useTasks();
  const { fontSize } = usePrefs();
  const { users } = useGroups();

  const [mainTab, setMainTab] = useState<MainTab>('tasks');
  const [scheduleScope, setScheduleScope] =
    useState<ScheduleScope>('mine');
  const [search, setSearch] = useState('');

  // --- стани для створення ЗАДАЧ ---
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>('medium');
  const [newTaskAssigneeId, setNewTaskAssigneeId] =
    useState<string | null>(user?.id ?? null);
  const [creatingTask, setCreatingTask] = useState(false);

  // --- стани для створення ЗМІНИ (shift) ---
  const [newShiftTitle, setNewShiftTitle] = useState('');
  const [newShiftAssigneeId, setNewShiftAssigneeId] =
    useState<string | null>(user?.id ?? null);
  const [creatingShift, setCreatingShift] = useState(false);

  // планування на тиждень
  const [newShiftDayOffset, setNewShiftDayOffset] = useState<number>(0); // 0 = dziś
  const [newShiftStartHour, setNewShiftStartHour] = useState<number>(8);
  const [newShiftEndHour, setNewShiftEndHour] = useState<number>(16);

  const canAssignOthers = isAdmin || isManager;
  const userId = user?.id ?? null;
  const myGroupIds = user?.groupIds ?? [];

  /** --- ДОСТУПНІ КОРИСТУВАЧІ ДЛЯ ЗАДАЧ/ГРАФІКУ --- */

  const availableUsers: User[] = useMemo(() => {
    // тільки люди з тих самих груп, що й я
    const sameGroupUsers = users.filter(u =>
      u.groupIds?.some(g => myGroupIds.includes(g))
    );
    if (!canAssignOthers) {
      // звичайний юзер бачить тільки себе
      return sameGroupUsers.filter(u => u.id === userId);
    }
    // manager/admin → всі з моїх груп
    return sameGroupUsers;
  }, [users, myGroupIds, canAssignOthers, userId]);

  // допоміжний сет для швидкої фільтрації змін для „Grafik wszystkich”
  const allowedUserIdsForSchedule = useMemo(
    () => new Set(availableUsers.map(u => u.id)),
    [availableUsers]
  );

  /** --- ZADANIA --- */

  // "Moje" zadania: przypisane do mnie LUB utworzone przeze mnie
  const myTasks = useMemo(() => {
    if (!userId) return [];
    return tasks.filter(
      t =>
        t.type === 'task' &&
        (t.assignedToId === userId || t.createdById === userId)
    );
  }, [tasks, userId]);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return myTasks;
    return myTasks.filter(
      t =>
        t.title.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
    );
  }, [myTasks, search]);

  const sortedActiveTasks = useMemo(() => {
    const active = filteredTasks.filter(
      t => t.status !== 'done'
    );

    return [...active].sort((a, b) => {
      const pa =
        priorityWeight[a.priority || 'none'] ?? priorityWeight.none;
      const pb =
        priorityWeight[b.priority || 'none'] ?? priorityWeight.none;

      if (pa !== pb) return pb - pa; // high -> low

      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (da !== db) return db - da; // nowsze wyżej

      return a.title.localeCompare(b.title, 'pl', {
        sensitivity: 'base',
      });
    });
  }, [filteredTasks]);

  const sortedDoneTasks = useMemo(() => {
    const done = filteredTasks.filter(t => t.status === 'done');

    return [...done].sort((a, b) => {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    });
  }, [filteredTasks]);

  /** --- GRAFIK --- */

  const shifts = useMemo(
    () => tasks.filter(t => t.type === 'shift'),
    [tasks]
  );

  const myShifts = useMemo(() => {
    if (!userId) return [];
    return shifts.filter(s => s.assignedToId === userId);
  }, [shifts, userId]);

  const allShiftsForMyGroupsSorted = useMemo(() => {
    // тільки зміни людей із моїх груп
    const filtered = shifts.filter(
      s =>
        s.assignedToId && allowedUserIdsForSchedule.has(s.assignedToId)
    );
    return [...filtered].sort((a, b) => {
      const da = a.startTime ? Date.parse(a.startTime) : 0;
      const db = b.startTime ? Date.parse(b.startTime) : 0;
      return da - db;
    });
  }, [shifts, allowedUserIdsForSchedule]);

  const scheduleData = useMemo(
    () => (scheduleScope === 'mine' ? myShifts : allShiftsForMyGroupsSorted),
    [scheduleScope, myShifts, allShiftsForMyGroupsSorted]
  );

  /** --- HANDLERY --- */

  const handleToggleDone = async (task: Task) => {
    if (task.type !== 'task') return;

    const current: TaskStatus = task.status || 'todo';
    const next: TaskStatus =
      current === 'done' ? 'in_progress' : 'done';

    try {
      await updateTask(task.id, { status: next });
    } catch (e) {
      console.warn('Failed to update task status', e);
    }
  };

  const handleCreateTask = async () => {
    if (!user) {
      Alert.alert('Błąd', 'Brak zalogowanego użytkownika.');
      return;
    }

    if (!newTaskTitle.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł zadania.');
      return;
    }

    const assigneeId = newTaskAssigneeId ?? user.id;
    const assigneeUser =
      users.find(u => u.id === assigneeId) || user;

    try {
      setCreatingTask(true);

      await createTask(
        {
          type: 'task',
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || undefined,
          assignedToId: assigneeId,
          company: assigneeUser.companyIds?.[0] || 'Nieznana firma',
          priority: newTaskPriority,
        },
        user.id
      );

      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskAssigneeId(user.id);

      Alert.alert('Sukces', 'Zadanie zostało utworzone.');
    } catch (e) {
      console.warn('Failed to create task', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć zadania.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleCreateShift = async () => {
    if (!user) {
      Alert.alert('Błąd', 'Brak zalogowanego użytkownika.');
      return;
    }

    if (!newShiftAssigneeId) {
      Alert.alert(
        'Błąd',
        'Wybierz użytkownika, dla którego chcesz dodać zmianę.'
      );
      return;
    }

    const now = new Date();
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + newShiftDayOffset);

    const start = new Date(base);
    start.setHours(newShiftStartHour, 0, 0, 0);

    const end = new Date(base);
    end.setHours(newShiftEndHour, 0, 0, 0);

    if (end <= start) {
      Alert.alert(
        'Błąd',
        'Godzina zakończenia musi być późniejsza niż rozpoczęcia.'
      );
      return;
    }

    if (start <= now) {
      Alert.alert(
        'Błąd',
        'Nie można dodać zmiany w przeszłości.'
      );
      return;
    }

    const assignedUser = users.find(u => u.id === newShiftAssigneeId);
    const title =
      newShiftTitle.trim() || 'Zmiana robocza';

    try {
      setCreatingShift(true);

      await createTask(
        {
          type: 'shift',
          title,
          assignedToId: newShiftAssigneeId,
          company:
            assignedUser?.companyIds?.[0] || 'Nieznana firma',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
        user.id
      );

      setNewShiftTitle('');
      Alert.alert(
        'Sukces',
        'Zmiana została dodana do grafiku.'
      );
    } catch (e) {
      console.warn('Failed to create shift', e);
      Alert.alert(
        'Błąd',
        'Nie udało się dodać zmiany.'
      );
    } finally {
      setCreatingShift(false);
    }
  };

  /** --- РЕНДЕР ЕЛЕМЕНТІВ --- */

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isDone = item.status === 'done';
    const isInProgress = item.status === 'in_progress';

    const priorityLabel =
      item.priority === 'high'
        ? 'Wysoki'
        : item.priority === 'medium'
        ? 'Średni'
        : item.priority === 'low'
        ? 'Niski'
        : null;

    return (
      <View
        style={[
          styles.taskCard,
          isDone && { opacity: 0.6 },
        ]}
      >
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              {
                fontSize: scaleFont(13, fontSize),
                textDecorationLine: isDone ? 'line-through' : 'none',
              },
            ]}
          >
            {item.title}
          </Text>
          {priorityLabel && (
            <View
              style={[
                styles.priorityChip,
                item.priority === 'high' && styles.priorityHigh,
                item.priority === 'medium' && styles.priorityMedium,
                item.priority === 'low' && styles.priorityLow,
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { fontSize: scaleFont(10, fontSize) },
                ]}
              >
                {priorityLabel}
              </Text>
            </View>
          )}
        </View>

        {!!item.description && (
          <Text
            style={[
              styles.taskDesc,
              { fontSize: scaleFont(11, fontSize) },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          {item.createdAt && (
            <Text
              style={[
                styles.taskMeta,
                { fontSize: scaleFont(10, fontSize) },
              ]}
            >
              Utworzone:{' '}
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.doneButton,
              isDone && styles.doneButtonInactive,
            ]}
            onPress={() => handleToggleDone(item)}
          >
            <Text
              style={[
                styles.doneButtonText,
                { fontSize: scaleFont(11, fontSize) },
              ]}
            >
              {isDone
                ? 'Przywróć'
                : isInProgress
                ? 'Odhacz jako zrobione'
                : 'Zakończ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderShiftItem = ({ item }: { item: Task }) => {
    const start = item.startTime
      ? new Date(item.startTime).toLocaleString()
      : '';
    const end = item.endTime
      ? new Date(item.endTime).toLocaleTimeString()
      : '';

    const assignedUser: User | undefined =
      users.find(u => u.id === item.assignedToId);

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
          {start} {end ? `– ${end}` : ''}
        </Text>
        {assignedUser && (
          <Text
            style={[
              styles.shiftMeta,
              { fontSize: scaleFont(11, fontSize) },
            ]}
          >
            Pracownik: {assignedUser.name}
          </Text>
        )}
        {!!item.company && (
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

  // допоміжні масиви для UI
  const next7Days = useMemo(() => {
    const days: { label: string; offset: number }[] = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const day = d.toLocaleDateString('pl-PL', {
        weekday: 'short',
      });
      const num = d.getDate();
      const label = i === 0 ? `Dziś (${num})` : i === 1 ? `Jutro (${num})` : `${day} (${num})`;
      days.push({ label, offset: i });
    }
    return days;
  }, []);

  const hoursPresets = [6, 8, 10, 12, 14, 16, 18, 20];

  const renderTasksTab = () => (
    <View style={styles.tabBody}>
      {/* Додати завдання */}
      <View style={styles.newTaskCard}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: scaleFont(14, fontSize) },
          ]}
        >
          Dodaj nowe zadanie
        </Text>
        <Text
          style={[
            styles.newTaskHint,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Zadanie może być przypisane do Ciebie lub (jako manager/admin) do innej osoby.
        </Text>

        <TextInput
          style={[
            styles.searchInput,
            {
              fontSize: scaleFont(13, fontSize),
              marginTop: 6,
              marginBottom: 4,
            },
          ]}
          placeholder="Tytuł zadania"
          placeholderTextColor={colors.textMuted}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
        />

        <TextInput
          style={[
            styles.searchInput,
            {
              fontSize: scaleFont(13, fontSize),
              marginBottom: 6,
              height: 70,
              textAlignVertical: 'top',
            },
          ]}
          multiline
          placeholder="Opis (opcjonalnie)"
          placeholderTextColor={colors.textMuted}
          value={newTaskDescription}
          onChangeText={setNewTaskDescription}
        />

        {/* Пріоритет */}
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high'] as TaskPriority[]).map(p => {
            const selected = newTaskPriority === p;
            const label =
              p === 'low'
                ? 'Niski'
                : p === 'medium'
                ? 'Średni'
                : 'Wysoki';
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.prioritySelectChip,
                  selected && styles.prioritySelectChipActive,
                ]}
                onPress={() => setNewTaskPriority(p)}
              >
                <Text
                  style={[
                    styles.prioritySelectText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: selected
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Кому призначити */}
        {canAssignOthers && (
          <Text
            style={[
              styles.newTaskHint,
              {
                fontSize: scaleFont(11, fontSize),
                marginTop: 4,
                marginBottom: 2,
              },
            ]}
          >
            Przypisz zadanie do:
          </Text>
        )}

        <FlatList
          horizontal
          data={availableUsers}
          keyExtractor={u => u.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          renderItem={({ item }) => {
            const selected = item.id === newTaskAssigneeId;
            return (
              <TouchableOpacity
                style={[
                  styles.userChip,
                  selected && styles.userChipActive,
                ]}
                onPress={() =>
                  setNewTaskAssigneeId(
                    selected ? null : item.id
                  )
                }
              >
                <Text
                  style={[
                    styles.userChipText,
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

        <TouchableOpacity
          style={[
            styles.createTaskButton,
            creatingTask && { opacity: 0.7 },
          ]}
          onPress={handleCreateTask}
          disabled={creatingTask || !user}
        >
          <Text
            style={[
              styles.createTaskButtonText,
              { fontSize: scaleFont(13, fontSize) },
            ]}
          >
            {creatingTask ? 'Dodawanie...' : 'Dodaj zadanie'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Пошук по задачах */}
      <TextInput
        style={[
          styles.searchInput,
          { fontSize: scaleFont(13, fontSize) },
        ]}
        placeholder="Szukaj w moich zadaniach..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {/* Активні задачі */}
      <Text
        style={[
          styles.sectionTitle,
          { fontSize: scaleFont(14, fontSize) },
        ]}
      >
        Aktywne ({sortedActiveTasks.length})
      </Text>
      {sortedActiveTasks.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { fontSize: scaleFont(12, fontSize) },
          ]}
        >
          Brak aktywnych zadań.
        </Text>
      ) : (
        <FlatList
          data={sortedActiveTasks}
          keyExtractor={t => t.id}
          renderItem={renderTaskItem}
          scrollEnabled={false}
        />
      )}

      {/* Зроблені задачі */}
      <Text
        style={[
          styles.sectionTitle,
          { fontSize: scaleFont(14, fontSize), marginTop: 12 },
        ]}
      >
        Zakończone ({sortedDoneTasks.length})
      </Text>
      {sortedDoneTasks.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { fontSize: scaleFont(12, fontSize) },
          ]}
        >
          Brak zakończonych zadań.
        </Text>
      ) : (
        <FlatList
          data={sortedDoneTasks}
          keyExtractor={t => t.id}
          renderItem={renderTaskItem}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderScheduleTab = () => (
    <View style={styles.tabBody}>
      {/* Додати зміну на тиждень */}
      <View style={styles.newShiftCard}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: scaleFont(14, fontSize) },
          ]}
        >
          Zaplanuj zmianę (do tygodnia)
        </Text>
        <Text
          style={[
            styles.newTaskHint,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Wybierz dzień oraz godziny zmiany. Nie możesz ustawiać zmian w przeszłości.
        </Text>

        {/* Дні тижня */}
        <FlatList
          horizontal
          data={next7Days}
          keyExtractor={d => String(d.offset)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 6 }}
          renderItem={({ item }) => {
            const selected = item.offset === newShiftDayOffset;
            return (
              <TouchableOpacity
                style={[
                  styles.dayChip,
                  selected && styles.dayChipActive,
                ]}
                onPress={() =>
                  setNewShiftDayOffset(item.offset)
                }
              >
                <Text
                  style={[
                    styles.dayChipText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: selected
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Години початку */}
        <Text
          style={[
            styles.newTaskHint,
            {
              fontSize: scaleFont(11, fontSize),
              marginTop: 4,
            },
          ]}
        >
          Godzina rozpoczęcia:
        </Text>
        <FlatList
          horizontal
          data={hoursPresets}
          keyExtractor={h => `start-${h}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          renderItem={({ item }) => {
            const selected = item === newShiftStartHour;
            return (
              <TouchableOpacity
                style={[
                  styles.hourChip,
                  selected && styles.hourChipActive,
                ]}
                onPress={() => setNewShiftStartHour(item)}
              >
                <Text
                  style={[
                    styles.hourChipText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: selected
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  {item}:00
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Години закінчення */}
        <Text
          style={[
            styles.newTaskHint,
            {
              fontSize: scaleFont(11, fontSize),
              marginTop: 4,
            },
          ]}
        >
          Godzina zakończenia:
        </Text>
        <FlatList
          horizontal
          data={hoursPresets}
          keyExtractor={h => `end-${h}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          renderItem={({ item }) => {
            const selected = item === newShiftEndHour;
            return (
              <TouchableOpacity
                style={[
                  styles.hourChip,
                  selected && styles.hourChipActive,
                ]}
                onPress={() => setNewShiftEndHour(item)}
              >
                <Text
                  style={[
                    styles.hourChipText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: selected
                        ? '#0b1120'
                        : colors.text,
                    },
                  ]}
                >
                  {item}:00
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {canAssignOthers && (
          <Text
            style={[
              styles.newTaskHint,
              {
                fontSize: scaleFont(11, fontSize),
                marginTop: 4,
              },
            ]}
          >
            Wybierz pracownika:
          </Text>
        )}

        <FlatList
          horizontal
          data={availableUsers}
          keyExtractor={u => u.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          renderItem={({ item }) => {
            const selected = item.id === newShiftAssigneeId;
            return (
              <TouchableOpacity
                style={[
                  styles.userChip,
                  selected && styles.userChipActive,
                ]}
                onPress={() =>
                  setNewShiftAssigneeId(
                    selected ? null : item.id
                  )
                }
              >
                <Text
                  style={[
                    styles.userChipText,
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

        <TouchableOpacity
          style={[
            styles.createTaskButton,
            creatingShift && { opacity: 0.7 },
          ]}
          onPress={handleCreateShift}
          disabled={creatingShift || !user}
        >
          <Text
            style={[
              styles.createTaskButtonText,
              { fontSize: scaleFont(13, fontSize) },
            ]}
          >
            {creatingShift ? 'Dodawanie...' : 'Dodaj zmianę'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segmentChip,
            scheduleScope === 'mine' && styles.segmentChipActive,
          ]}
          onPress={() => setScheduleScope('mine')}
        >
          <Text
            style={[
              styles.segmentText,
              {
                fontSize: scaleFont(12, fontSize),
                color:
                  scheduleScope === 'mine'
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
            styles.segmentChip,
            scheduleScope === 'all' && styles.segmentChipActive,
          ]}
          onPress={() => setScheduleScope('all')}
        >
          <Text
            style={[
              styles.segmentText,
              {
                fontSize: scaleFont(12, fontSize),
                color:
                  scheduleScope === 'all'
                    ? '#0b1120'
                    : colors.text,
              },
            ]}
          >
            Grafik moich grup
          </Text>
        </TouchableOpacity>
      </View>

      {scheduleData.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { fontSize: scaleFont(12, fontSize) },
          ]}
        >
          Brak zmian do wyświetlenia.
        </Text>
      ) : (
        <FlatList
          data={scheduleData}
          keyExtractor={s => s.id}
          renderItem={renderShiftItem}
        />
      )}
    </View>
  );


  return (
    <Screen>
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            { fontSize: scaleFont(20, fontSize) },
          ]}
        >
          Zadania i grafik
        </Text>

        <View style={styles.mainTabsRow}>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'tasks' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('tasks')}
          >
            <Text
              style={[
                styles.mainTabText,
                {
                  fontSize: scaleFont(13, fontSize),
                  color:
                    mainTab === 'tasks'
                      ? '#0b1120'
                      : colors.text,
                },
              ]}
            >
              Zadania
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'schedule' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('schedule')}
          >
            <Text
              style={[
                styles.mainTabText,
                {
                  fontSize: scaleFont(13, fontSize),
                  color:
                    mainTab === 'schedule'
                      ? '#0b1120'
                      : colors.text,
                },
              ]}
            >
              Grafik
            </Text>
          </TouchableOpacity>
        </View>

        {mainTab === 'tasks' ? renderTasksTab() : renderScheduleTab()}
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
    marginBottom: 12,
  },
  mainTabsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  mainTab: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#020617',
  },
  mainTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  mainTabText: {
    fontWeight: '600',
    color: colors.text,
  },
  tabBody: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: 8,
  },

  /* --- карточка додавання задачі --- */
  newTaskCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 10,
  },
  newTaskHint: {
    color: colors.textMuted,
  },
  priorityRow: {
    flexDirection: 'row',
    marginBottom: 6,
    marginTop: 4,
  },
  prioritySelectChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#020617',
  },
  prioritySelectChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  prioritySelectText: {
    color: colors.text,
    fontWeight: '500',
  },
  createTaskButton: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingVertical: 8,
    alignItems: 'center',
  },
  createTaskButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },

  taskCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 6,
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
  taskDesc: {
    color: colors.textMuted,
    marginTop: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  taskMeta: {
    color: colors.textMuted,
  },
  doneButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.accent,
  },
  doneButtonInactive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
  priorityChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#1f2937',
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#f59e0b',
  },
  priorityLow: {
    backgroundColor: '#10b981',
  },
  priorityText: {
    color: '#f9fafb',
    fontWeight: '600',
  },

  segmentRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 8,
  },
  segmentChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#020617',
  },
  segmentChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    fontWeight: '500',
    color: colors.text,
  },
  shiftCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 6,
  },
  shiftTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  shiftMeta: {
    color: colors.textMuted,
    marginTop: 2,
  },
  newShiftCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 10,
  },

  dayChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#020617',
  },
  dayChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayChipText: {
    color: colors.text,
  },
  hourChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#020617',
  },
  hourChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  hourChipText: {
    color: colors.text,
  },
  userChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#020617',
  },
  userChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  userChipText: {
    color: colors.text,
  },
});
