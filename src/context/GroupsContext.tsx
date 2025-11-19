// src/context/GroupsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/api';
import { User } from '../models/User';
import { Group } from '../models/Group';
import { useAuth } from './AuthContext';

interface GroupsContextValue {
  users: User[];
  groups: Group[];
  loading: boolean;
  refresh: () => Promise<void>;
  addUserToGroup: (email: string, groupId: string) => Promise<void>;
  visibleGroups: Group[];
}

const GroupsContext = createContext<GroupsContextValue | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<Group[]>('/groups'),
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

const addUserToGroup = async (email: string, groupId: string) => {
  const emailNorm = email.toLowerCase().trim();

  const userToAdd = users.find(
    u => u.email.toLowerCase() === emailNorm
  );

  if (!userToAdd) {
    throw new Error('Użytkownik nie znaleziony (sprawdź email)');
  }

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error('Grupa nie istnieje');
  }

  const nextGroupIds = userToAdd.groupIds.includes(groupId)
    ? userToAdd.groupIds
    : [...userToAdd.groupIds, groupId];

  const nextCompanyIds = group.company
    ? Array.from(
        new Set([...(userToAdd.companyIds || []), group.company])
      )
    : userToAdd.companyIds || [];

  const updated = {
    ...userToAdd,
    groupIds: nextGroupIds,
    companyIds: nextCompanyIds,
  };

  await api.patch(`/users/${userToAdd.id}`, {
    groupIds: nextGroupIds,
    companyIds: nextCompanyIds,
  });

  setUsers(prev => prev.map(u => (u.id === userToAdd.id ? updated : u)));
};

  let visibleGroups: Group[] = [];
  if (user) {
    if (user.roles.includes('admin')) {
      visibleGroups = groups;
    } else if (user.roles.includes('manager')) {
      visibleGroups = groups.filter(g => g.managerId === user.id || user.groupIds.includes(g.id));
    } else {
      visibleGroups = groups.filter(g => user.groupIds.includes(g.id));
    }
  }

  return (
    <GroupsContext.Provider
      value={{
        users,
        groups,
        loading,
        refresh,
        addUserToGroup,
        visibleGroups,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
};
