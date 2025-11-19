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

  password?: string;
}
