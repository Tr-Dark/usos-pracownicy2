// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';
import { UserAvatar } from '../components/UserAvatar';

const ProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { fontSize } = usePrefs();

  const [name, setName] = useState(user?.name ?? '');
  const [position, setPosition] = useState(user?.position ?? '');
  const [password, setPassword] = useState('');

  if (!user) return null;

  const onSave = async () => {
    try {
      await updateProfile({
        name,
        position,
        password: password || undefined,
      });
      setPassword('');
      Alert.alert('Sukces', 'Profil zaktualizowany');
    } catch (e: any) {
      Alert.alert('Błąd', e.message ?? 'Nie udało się zaktualizować profilu');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <UserAvatar uri={user.avatar} label={user.name} size={72} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Imię i nazwisko
          </Text>
          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(14, fontSize) },
            ]}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Stanowisko
          </Text>
          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(14, fontSize) },
            ]}
            value={position}
            onChangeText={setPosition}
            placeholder="Junior, Specjalista, Manager..."
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Nowe hasło
          </Text>
          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(14, fontSize) },
            ]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Zostaw puste, aby nie zmieniać"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.button} onPress={onSave}>
            <Text
              style={[
                styles.buttonText,
                { fontSize: scaleFont(14, fontSize) },
              ]}
            >
              Zapisz zmiany
            </Text>
          </TouchableOpacity>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
