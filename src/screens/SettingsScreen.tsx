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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const SettingsScreen: React.FC = () => {
  const { darkMode, fontSize, setDarkMode, setFontSize } = usePrefs() as any;
  const { logout, isAdmin } = useAuth();
  const navigation = useNavigation<Nav>();

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Ustawienia
        </Text>

        {/* Nawigacja: profil / panel admina */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize) },
            ]}
          >
            Konto
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text
              style={[
                styles.buttonText,
                { fontSize: scaleFont(14, fontSize) },
              ]}
            >
              Mój profil
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('AdminPanel')}
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: scaleFont(14, fontSize) },
                ]}
              >
                Panel administratora
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Wygląd */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize) },
            ]}
          >
            Wygląd
          </Text>

          <View style={styles.rowBetween}>
            <Text
              style={[
                styles.label,
                { fontSize: scaleFont(13, fontSize) },
              ]}
            >
              Tryb ciemny
            </Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={darkMode ? colors.accent : '#e5e7eb'}
              trackColor={{ true: '#1e293b', false: '#4b5563' }}
            />
          </View>

          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(13, fontSize), marginTop: 12 },
            ]}
          >
            Rozmiar czcionki
          </Text>
          <View style={styles.fontRow}>
            {(['small', 'normal', 'large'] as const).map(size => {
              const active = fontSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontChip,
                    active && styles.fontChipActive,
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                >
                  <Text
                    style={[
                      styles.fontChipText,
                      {
                        fontSize: scaleFont(12, fontSize),
                        color: active ? '#0b1120' : colors.text,
                      },
                    ]}
                  >
                    {size === 'small'
                      ? 'Mała'
                      : size === 'normal'
                      ? 'Normalna'
                      : 'Duża'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize) },
            ]}
          >
            Sesja
          </Text>

          <TouchableOpacity
            style={[styles.logoutButton]}
            onPress={logout}
          >
            <Text
              style={[
                styles.logoutText,
                { fontSize: scaleFont(14, fontSize) },
              ]}
            >
              Wyloguj się
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
  },
  fontRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  fontChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  fontChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  fontChipText: {
    color: colors.text,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});
