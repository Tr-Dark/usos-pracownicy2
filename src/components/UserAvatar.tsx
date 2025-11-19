// src/components/UserAvatar.tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface UserAvatarProps {
  uri?: string;
  size?: number;
  label?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size = 40, label }) => {
  const initials = label ? label.trim().charAt(0).toUpperCase() : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.fallbackText}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
