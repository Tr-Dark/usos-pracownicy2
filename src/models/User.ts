// src/models/User.ts
export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  position: string;           // Junior, Specjalista, Manager, itd.
  roles: UserRole[];
  groupIds: string[];
  companyIds: string[];

  // для json-server авторизації (не обов'язково в UI)
  password?: string;
}
