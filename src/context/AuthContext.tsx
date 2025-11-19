// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import { User } from '../models/User';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    position?: string;
    password?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_KEY = '@auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch (e) {
        console.warn('Failed to load auth', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (user: User | null, token: string | null) => {
    if (user && token) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.get<User[]>('/users', { params: { email } });
    const found = data[0];
    if (!found || found.password !== password) {
      throw new Error('Nieprawidłowy email lub hasło');
    }
    const fakeToken = 'fake-jwt-token';
    setUser(found);
    setToken(fakeToken);
    await persist(found, fakeToken);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data: existing } = await api.get<User[]>('/users', { params: { email } });
    if (existing.length > 0) {
      throw new Error('Użytkownik z takim emailem już istnieje');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      avatar: 'https://i.pravatar.cc/150?u=' + email,
      position: 'Junior',
      roles: ['user'],
      groupIds: [],
      companyIds: [],
      password,
    };

    const { data: created } = await api.post<User>('/users', newUser);
    const fakeToken = 'fake-jwt-token';
    setUser(created);
    setToken(fakeToken);
    await persist(created, fakeToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await persist(null, null);
  };

  const updateProfile = async (updates: {
    name?: string;
    position?: string;
    password?: string;
  }) => {
    if (!user) return;

    const payload: Partial<User> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.position !== undefined) payload.position = updates.position;
    if (updates.password !== undefined) (payload as any).password = updates.password;

    const { data } = await api.patch<User>(`/users/${user.id}`, payload);

    const merged: User = { ...user, ...data };
    setUser(merged);
    if (token) {
      await persist(merged, token);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
