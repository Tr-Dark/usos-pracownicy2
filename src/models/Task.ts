// src/models/Task.ts

export type TaskType = 'task' | 'shift';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  type: TaskType;

  title: string;
  description?: string;

  assignedToId?: string;   // użytkownik
  groupId?: string;        // grupa (opcjonalnie)
  company?: string;

  // tylko dla typu "task"
  status?: TaskStatus;
  priority?: TaskPriority;

  // meta
  createdAt?: string;      // ISO
  createdById?: string;    // kto utworzył zadanie

  // tylko dla typu "shift"
  startTime?: string;      // ISO
  endTime?: string;        // ISO
}
