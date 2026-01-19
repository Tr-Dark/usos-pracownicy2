// src/models/Attendance.ts

export type AttendanceType = 'check';

export interface Attendance {
  id: string;
  userId: string;
  timestamp: string;
  type: AttendanceType;
  groupId?: string;
}
