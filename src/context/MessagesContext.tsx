// src/context/MessagesContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/api';
import { Message } from '../models/Message';
import { useAuth } from './AuthContext';

interface MessagesContextValue {
  messages: Message[];
  loading: boolean;
  activeChatUserId: string | null;
  setActiveChatUserId: (id: string | null) => void;

  refreshMessages: () => Promise<void>;

  sending: boolean;
  sendMessage: (toUserId: string, text: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

  const refreshMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Message[]>('/messages');
      setMessages(data);
    } catch (e) {
      console.warn('Failed to refresh messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMessages();
  }, []);

  const sendMessage = async (toUserId: string, text: string) => {
    if (!user) return;

    const payload: Message = {
      id: Date.now().toString(),
      fromUserId: user.id,
      toUserId,
      text,
      timestamp: new Date().toISOString(),
    };

    setSending(true);
    try {
      const { data } = await api.post<Message>('/messages', payload);
      setMessages(prev => [...prev, data]);
    } catch (e) {
      console.warn('Failed to send message', e);
      throw e;
    } finally {
      setSending(false);
    }
  };

  return (
    <MessagesContext.Provider
      value={{
        messages,
        loading,
        activeChatUserId,
        setActiveChatUserId,
        refreshMessages,
        sending,
        sendMessage,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
