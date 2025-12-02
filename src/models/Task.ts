// src/models/Task.ts

export type TaskType = 'task' | 'shift';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  type: TaskType;

  title: string;
  description?: string;

  // для type === 'task'
  status?: TaskStatus;
  assignedToId?: string; // кому призначено

  // для всіх
  createdById: string;   // хто створив
  groupId?: string;      // до якої групи прив'язано
  company?: string;

  // для type === 'shift'
  startTime?: string;
  endTime?: string;
}
