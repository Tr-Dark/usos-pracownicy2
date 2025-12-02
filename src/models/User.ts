// src/models/User.ts

export type Role = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  position: string;
  roles: Role[];
  groupIds: string[];
  companyIds: string[];
  password?: string; // json-server: пароль теж лежить в users
}
