// src/screens/ProfileScreen.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';
import { UserAvatar } from '../components/UserAvatar';

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const { fontSize } = usePrefs();

  if (!user) return null;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <UserAvatar uri={user.avatar} label={user.name} size={72} />
          <Text style={[styles.name, { fontSize: scaleFont(20, fontSize) }]}>
            {user.name}
          </Text>
          <Text style={[styles.position, { fontSize: scaleFont(14, fontSize) }]}>
            {user.position}
          </Text>
          <Text style={[styles.email, { fontSize: scaleFont(12, fontSize) }]}>
            {user.email}
          </Text>
        </View>
      </View>
    </Screen>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 12,
  },
  position: {
    color: colors.textMuted,
    marginTop: 4,
  },
  email: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
