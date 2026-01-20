// src/screens/SettingsScreen.tsx
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { usePrefs } from '../context/PrefsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/RootNavigator';
import { getColors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const SettingsScreen: React.FC = () => {
  const { darkMode, fontSize, setDarkMode, setFontSize } = usePrefs() as any;
  const c = getColors(darkMode);

  const { logout, isAdmin } = useAuth();
  const navigation = useNavigation<Nav>();

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size);
  };

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text
          style={[
            styles.title,
            { fontSize: scaleFont(20, fontSize), color: c.text },
          ]}
        >
          Ustawienia
        </Text>

        {/* Konto */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize), color: c.text },
            ]}
          >
            Konto
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              { borderColor: c.border, backgroundColor: c.inputBg },
            ]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text
              style={[
                styles.buttonText,
                { fontSize: scaleFont(14, fontSize), color: c.text },
              ]}
            >
              Mój profil
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.button,
                { borderColor: c.border, backgroundColor: c.inputBg },
              ]}
              onPress={() => navigation.navigate('AdminPanel')}
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: scaleFont(14, fontSize), color: c.text },
                ]}
              >
                Panel administratora
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Wygląd */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize), color: c.text },
            ]}
          >
            Wygląd
          </Text>

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { fontSize: scaleFont(13, fontSize), color: c.text }]}>
              Tryb ciemny
            </Text>

            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={darkMode ? c.accent : '#e5e7eb'}
              trackColor={{ true: c.border, false: '#cbd5e1' }}
            />
          </View>

          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(13, fontSize), marginTop: 12, color: c.text },
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
                    {
                      borderColor: active ? c.accent : c.border,
                      backgroundColor: active ? c.accent : c.inputBg,
                    },
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                >
                  <Text
                    style={[
                      styles.fontChipText,
                      {
                        fontSize: scaleFont(12, fontSize),
                        color: active ? '#0b1120' : c.text,
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

        {/* Sesja */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: scaleFont(15, fontSize), color: c.text },
            ]}
          >
            Sesja
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {},
  fontRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  fontChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  fontChipText: {
    fontWeight: '500',
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  buttonText: {
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
