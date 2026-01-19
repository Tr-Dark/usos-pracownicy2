// src/screens/MessagesScreen.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { useGroups } from '../context/GroupsContext';
import { usePrefs } from '../context/PrefsContext';
import { MessageBubble } from '../components/MessageBubble';
import { UserAvatar } from '../components/UserAvatar';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';
import { Message } from '../models/Message';
import { User } from '../models/User';

const BOTTOM_THRESHOLD_PX = 60; 

const MessagesScreen: React.FC = () => {
  const { user: me } = useAuth();
  const {
    messages,
    activeChatUserId,
    setActiveChatUserId,
    sendMessage,
    refreshMessages,
    loading,
    sending,
  } = useMessages();

  const { users, visibleGroups } = useGroups();
  const { fontSize } = usePrefs();

  const [text, setText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isTypingRef = useRef(false);

  const isAtBottomRef = useRef(true);

  const listRef = useRef<FlatList<Message> | null>(null);

  if (!me) return null;

  // == Ludzie z moich grup ==
  const coworkersFromGroups: User[] = useMemo(() => {
    const myGroupIds = visibleGroups.map(g => g.id);
    const setIds = new Set<string>();

    return users.filter(u => {
      if (u.id === me.id) return false;
      const common = u.groupIds?.some(gId => myGroupIds.includes(gId));
      if (!common) return false;
      if (setIds.has(u.id)) return false;
      setIds.add(u.id);
      return true;
    });
  }, [users, visibleGroups, me.id]);

  // == Admini jako "support" ==
  const adminUsers: User[] = useMemo(
    () => users.filter(u => u.id !== me.id && u.roles?.includes('admin')),
    [users, me.id]
  );

  const coworkers: User[] = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of coworkersFromGroups) map.set(u.id, u);
    for (const u of adminUsers) map.set(u.id, u);
    return Array.from(map.values());
  }, [coworkersFromGroups, adminUsers]);

  const activeUser: User | undefined = useMemo(
    () => coworkers.find(c => c.id === activeChatUserId) ?? coworkers[0],
    [coworkers, activeChatUserId]
  );

  useEffect(() => {
    if (!activeChatUserId && coworkers[0]) {
      setActiveChatUserId(coworkers[0].id);
    }
  }, [coworkers, activeChatUserId, setActiveChatUserId]);

  const conversation: Message[] = useMemo(() => {
    if (!activeUser) return [];
    return messages
      .filter(
        m =>
          (m.fromUserId === me.id && m.toUserId === activeUser.id) ||
          (m.fromUserId === activeUser.id && m.toUserId === me.id)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }, [messages, me.id, activeUser]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshMessages();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto refresh co 10 sekund
  useEffect(() => {
    const id = setInterval(() => {
      if (isTypingRef.current) return;
      if (sending) return;

      refreshMessages().catch(() => {});
    }, 10000);

    return () => clearInterval(id);
  }, [refreshMessages, sending]);

  useEffect(() => {
    if (!listRef.current) return;
    if (conversation.length === 0) return;

    if (!isAtBottomRef.current) return; 
    if (isTypingRef.current) return; 

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [conversation.length]);

  const handleSend = async () => {
    if (!activeUser || !text.trim()) return;

    const msg = text.trim();
    setText('');
    isTypingRef.current = false;

    try {
      await sendMessage(activeUser.id, msg);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się wysłać wiadomości.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.fromUserId === me.id;
    const user = (!isOwn && activeUser) || (isOwn && me) || undefined;
    return <MessageBubble message={item} isOwn={isOwn} user={user} />;
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    isAtBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={80}
      >
        <View style={styles.container}>
          <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
            Wiadomości
          </Text>

          {activeUser && (
            <Text style={[styles.activeUserInfo, { fontSize: scaleFont(12, fontSize) }]}>
              {activeUser.name} • {activeUser.position}
            </Text>
          )}

          {/* Lista użytkowników */}
          <FlatList
            horizontal
            style={styles.usersList}
            contentContainerStyle={styles.usersRow}
            data={coworkers}
            keyExtractor={u => u.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = item.id === activeUser?.id;

              return (
                <TouchableOpacity
                  onPress={() => setActiveChatUserId(item.id)}
                  style={styles.userChipWrapper}
                >
                  <View style={[styles.userChip, isActive && styles.userChipActive]}>
                    <UserAvatar uri={item.avatar} label={item.name} size={44} />
                  </View>
                  <Text numberOfLines={1} style={[styles.userName, { fontSize: scaleFont(11, fontSize) }]}>
                    {item.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Wiadomości */}
          <View style={styles.messagesWrapper}>
            {activeUser ? (
              <FlatList
                ref={(r) => { listRef.current = r; }}
                data={conversation}
                keyExtractor={m => m.id}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingVertical: 8 }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing || loading}
                    onRefresh={onRefresh}
                    tintColor={colors.accent}
                  />
                }
                onContentSizeChange={() => {
                  if (isAtBottomRef.current) {
                    listRef.current?.scrollToEnd({ animated: false });
                  }
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { fontSize: scaleFont(14, fontSize) }]}>
                  Brak współpracowników do rozmowy.
                </Text>
              </View>
            )}
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
              placeholder="Napisz wiadomość..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={(v) => {
                setText(v);
                isTypingRef.current = v.trim().length > 0;
              }}
              onFocus={() => { isTypingRef.current = true; }}
              onBlur={() => { isTypingRef.current = text.trim().length > 0; }}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, (sending || !text.trim()) && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={sending || !text.trim()}
            >
              <Text style={[styles.sendButtonText, { fontSize: scaleFont(14, fontSize) }]}>
                {sending ? '...' : 'Wyślij'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  activeUserInfo: {
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },

  usersList: {
    maxHeight: 80,
  },
  usersRow: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  userChipWrapper: {
    alignItems: 'center',
    marginRight: 12,
  },
  userChip: {
    borderRadius: 999,
    padding: 2,
  },
  userChipActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  userName: {
    color: colors.text,
    marginTop: 4,
    maxWidth: 70,
    textAlign: 'center',
  },

  messagesWrapper: {
    flex: 1,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
