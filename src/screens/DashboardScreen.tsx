// src/screens/DashboardScreen.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { fontSize } = usePrefs();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(22, fontSize) }]}>
          Dzień dobry, {user?.name ?? 'Pracowniku'} 👋
        </Text>
        <Text style={[styles.subtitle, { fontSize: scaleFont(14, fontSize) }]}>
          Szybki podgląd Twoich grup, zadań i wiadomości.
        </Text>
        {/* Тут можна додати картки підсумків, np. ilość zadań */}
      </View>
    </Screen>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
  },
});
