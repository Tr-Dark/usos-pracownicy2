// src/screens/MessagesScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

const MessagesScreen: React.FC = () => {
  const { user: me } = useAuth();
  const { messages, activeChatUserId, setActiveChatUserId, sendMessage } =
    useMessages();
  const { users, visibleGroups } = useGroups();
  const { fontSize } = usePrefs();
  const [text, setText] = useState('');

  const coworkers: User[] = useMemo(() => {
    if (!me) return [];
    const myGroupIds = visibleGroups.map(g => g.id);
    const setIds = new Set<string>();

    return users.filter(u => {
      if (u.id === me.id) return false;
      const common = u.groupIds.some(gId => myGroupIds.includes(gId));
      if (!common) return false;
      if (setIds.has(u.id)) return false;
      setIds.add(u.id);
      return true;
    });
  }, [users, visibleGroups, me]);

  const activeUser: User | undefined = useMemo(
    () => coworkers.find(c => c.id === activeChatUserId) ?? coworkers[0],
    [coworkers, activeChatUserId]
  );

  React.useEffect(() => {
    if (!activeChatUserId && coworkers[0]) {
      setActiveChatUserId(coworkers[0].id);
    }
  }, [coworkers, activeChatUserId, setActiveChatUserId]);

  const conversation: Message[] = useMemo(() => {
    if (!me || !activeUser) return [];
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
  }, [messages, me, activeUser]);

  const handleSend = async () => {
    if (!activeUser || !text.trim()) return;
    await sendMessage(activeUser.id, text.trim());
    setText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.fromUserId === me?.id;
    const user =
      (!isOwn && activeUser) ||
      (isOwn && me) ||
      undefined;
    return <MessageBubble message={item} isOwn={isOwn} user={user} />;
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

          {/* Горизонтальний список користувачів */}
          <FlatList
            horizontal
            data={coworkers}
            keyExtractor={u => u.id}
            contentContainerStyle={styles.usersRow}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveChatUserId(item.id)}
                style={[
                  styles.userChip,
                  item.id === activeUser?.id && styles.userChipActive,
                ]}
              >
                <UserAvatar uri={item.avatar} label={item.name} size={40} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.userName,
                    {
                      fontSize: scaleFont(11, fontSize),
                    },
                  ]}
                >
                  {item.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Список повідомлень */}
          <View style={styles.messagesWrapper}>
            {activeUser ? (
              <FlatList
                data={conversation}
                keyExtractor={m => m.id}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyText,
                    { fontSize: scaleFont(14, fontSize) },
                  ]}
                >
                  Brak współpracowników w Twoich grupach.
                </Text>
              </View>
            )}
          </View>

          {/* Sticky input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { fontSize: scaleFont(14, fontSize) },
              ]}
              placeholder="Napisz wiadomość..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  { fontSize: scaleFont(14, fontSize) },
                ]}
              >
                Wyślij
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
    marginBottom: 8,
  },
  usersRow: {
    paddingVertical: 8,
  },
  userChip: {
    alignItems: 'center',
    marginRight: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  userChipActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  userName: {
    color: colors.text,
    marginTop: 4,
    maxWidth: 64,
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
