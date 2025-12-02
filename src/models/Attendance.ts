// src/models/Attendance.ts

export type AttendanceType = 'check'; // на майбутнє можна розширити: 'in' | 'out'

export interface Attendance {
  id: string;
  userId: string;
  timestamp: string;
  type: AttendanceType;
  groupId?: string;
}
