// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { usePrefs } from '../context/PrefsContext';
import { useAuth } from '../context/AuthContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';

const SettingsScreen: React.FC = () => {
  const { darkMode, setDarkMode, fontSize, setFontSize } = usePrefs();
  const { logout } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Ustawienia
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text
                style={[
                  styles.label,
                  { fontSize: scaleFont(14, fontSize) },
                ]}
              >
                Ciemny motyw
              </Text>
              <Text
                style={[
                  styles.description,
                  { fontSize: scaleFont(11, fontSize) },
                ]}
              >
                Domyślnie włączony
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>

          <View style={styles.separator} />

          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(14, fontSize) },
            ]}
          >
            Rozmiar czcionki
          </Text>
          <View style={styles.fontRow}>
            {(['small', 'normal', 'large'] as const).map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontButton,
                  fontSize === size && styles.fontButtonActive,
                ]}
                onPress={() => setFontSize(size)}
              >
                <Text
                  style={[
                    styles.fontButtonText,
                    {
                      fontSize: scaleFont(
                        size === 'small' ? 11 : size === 'normal' ? 13 : 15,
                        fontSize
                      ),
                    },
                  ]}
                >
                  {size === 'small'
                    ? 'A-'
                    : size === 'normal'
                    ? 'A'
                    : 'A+'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text
            style={[
              styles.logoutText,
              { fontSize: scaleFont(14, fontSize) },
            ]}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.text,
    fontWeight: '600',
  },
  description: {
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  fontRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  fontButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  fontButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  fontButtonText: {
    color: colors.text,
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: colors.danger,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
