// src/context/GroupsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { api } from '../api/api';
import { Group } from '../models/Group';
import { Role, User } from '../models/User';
import { useAuth } from './AuthContext';

interface GroupsContextValue {
  users: User[];
  groups: Group[];
  visibleGroups: Group[];
  loading: boolean;
  refresh: () => Promise<void>;
  addUserToGroup: (email: string, groupId: string) => Promise<void>;
  updateUserRoles: (userId: string, roles: Role[]) => Promise<void>;
  createGroup: (input: {
    name: string;
    company: string;
    managerId: string;
  }) => Promise<void>;
}

const GroupsContext = createContext<GroupsContextValue | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [usersRes, groupsRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<Group[]>('/groups'),
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
    } catch (e) {
      console.warn('Failed to load users/groups', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    await load();
  };

  const visibleGroups: Group[] = useMemo(() => {
    if (!user) return [];
    if (user.roles.includes('admin')) {
      return groups;
    }

    const userGroupIds = user.groupIds ?? [];

    if (user.roles.includes('manager')) {
      return groups.filter(
        g => g.managerId === user.id || userGroupIds.includes(g.id)
      );
    }

    return groups.filter(g => userGroupIds.includes(g.id));
  }, [groups, user]);

  const addUserToGroup = async (email: string, groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupa nie istnieje');
    }

    let target = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!target) {
      const { data } = await api.get<User[]>('/users', {
        params: { email },
      });
      target = data[0];
    }

    if (!target) {
      throw new Error('Użytkownik o takim emailu nie został znaleziony');
    }

    if (target.groupIds?.includes(groupId)) {
      throw new Error('Użytkownik już jest w tej grupie');
    }

    const updated: User = {
      ...target,
      groupIds: [...(target.groupIds ?? []), groupId],
      companyIds: target.companyIds?.includes(group.company)
        ? target.companyIds
        : [...(target.companyIds ?? []), group.company],
    };

    const { data } = await api.patch<User>(`/users/${target.id}`, {
      groupIds: updated.groupIds,
      companyIds: updated.companyIds,
    });

    setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
  };

  const updateUserRoles = async (userId: string, roles: Role[]) => {
    const { data } = await api.patch<User>(`/users/${userId}`, { roles });
    setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
  };

  const createGroup = async (input: {
    name: string;
    company: string;
    managerId: string;
  }) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name: input.name,
      company: input.company,
      managerId: input.managerId,
    };

    const { data } = await api.post<Group>('/groups', newGroup);
    setGroups(prev => [...prev, data]);
  };

  return (
    <GroupsContext.Provider
      value={{
        users,
        groups,
        visibleGroups,
        loading,
        refresh,
        addUserToGroup,
        updateUserRoles,
        createGroup,
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
