// src/context/TasksContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api } from '../api/api';
import { Task, TaskStatus, TaskType } from '../models/Task';

interface CreateTaskInput {
  type: TaskType;
  title: string;
  description?: string;
  assignedToId?: string;
  groupId?: string;
  company?: string;
  startTime?: string;
  endTime?: string;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  refresh: () => Promise<void>;
  createTask: (input: CreateTaskInput, createdById: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const createTask = async (input: CreateTaskInput, createdById: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...input,
      createdById,
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

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}`, { status });
      setTasks(prev => prev.map(t => (t.id === id ? data : t)));
    } catch (e) {
      console.warn('Failed to update task status', e);
      throw e;
    }
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        refresh,
        createTask,
        updateTaskStatus,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
};
