// src/context/TasksContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api } from '../api/api';
import {
  Task,
  TaskStatus,
  TaskType,
  TaskPriority,
} from '../models/Task';

interface CreateTaskInput {
  type: TaskType;
  title: string;
  description?: string;
  assignedToId?: string;
  groupId?: string;
  company?: string;
  startTime?: string;
  endTime?: string;
  priority?: TaskPriority;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  refresh: () => Promise<void>;
  createTask: (input: CreateTaskInput, createdById: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(
  undefined
);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Task[]>('/tasks');
      setTasks(data);
    } catch (e) {
      console.warn('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const refresh = async () => {
    await loadTasks();
  };

  const createTask = async (
    input: CreateTaskInput,
    createdById: string
  ) => {
    const nowIso = new Date().toISOString();

    const newTask: Task = {
      id: Date.now().toString(),
      ...input,
      createdById,
      createdAt: nowIso,
      status: input.type === 'task' ? 'todo' : undefined,
    };

    try {
      const { data } = await api.post<Task>('/tasks', newTask);
      setTasks(prev => [...prev, data]);
    } catch (e) {
      console.warn('Failed to create task', e);
      throw e;
    }
  };

  const updateTask = async (
    id: string,
    patch: Partial<Task>
  ): Promise<void> => {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}`, patch);
      setTasks(prev => prev.map(t => (t.id === id ? data : t)));
    } catch (e) {
      console.warn('Failed to update task', e);
      throw e;
    }
  };

  const updateTaskStatus = async (
    id: string,
    status: TaskStatus
  ): Promise<void> => {
    return updateTask(id, { status });
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        refresh,
        createTask,
        updateTask,
        updateTaskStatus,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TasksContext);
  if (!ctx)
    throw new Error('useTasks must be used within TasksProvider');
  return ctx;
};
