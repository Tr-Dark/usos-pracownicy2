// src/components/MessageBubble.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { UserAvatar } from './UserAvatar';
import { colors } from '../theme/colors';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  user?: User;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, user }) => {
  const { fontSize } = usePrefs();
  const date = new Date(message.timestamp);
  const time = date.toLocaleTimeString().slice(0, 5);

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.containerRight : styles.containerLeft,
      ]}
    >
      {!isOwn && (
        <UserAvatar
          uri={user?.avatar}
          label={user?.name}
          size={32}
        />
      )}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {!!user && !isOwn && (
          <Text
            style={[
              styles.name,
              { fontSize: scaleFont(10, fontSize) },
            ]}
          >
            {user.name}
          </Text>
        )}
        <Text
          style={[
            styles.text,
            { fontSize: scaleFont(14, fontSize) },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            { fontSize: scaleFont(10, fontSize) },
          ]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  bubbleOwn: {
    backgroundColor: colors.accentSoft,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  text: {
    color: colors.text,
  },
  time: {
    marginTop: 4,
    alignSelf: 'flex-end',
    color: colors.textMuted,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
    color: colors.textMuted,
  },
});
