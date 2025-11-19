// src/models/Task.ts
export type TaskType = 'task' | 'shift';

export interface Task {
  id: string;
  type: TaskType;            // 'task' - задача, 'shift' - елемент розкладу
  title: string;
  description?: string;
  assignedToId?: string;     // для задач
  status?: 'todo' | 'in_progress' | 'done';
  company?: string;

  startTime?: string;        // ISO, для shift
  endTime?: string;
}
