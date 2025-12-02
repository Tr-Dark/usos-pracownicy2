// src/screens/ProfileScreen.tsx
import React, { useMemo, useState } from 'react';
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
import { useGroups } from '../context/GroupsContext';
import { usePrefs } from '../context/PrefsContext';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { UserAvatar } from '../components/UserAvatar';

const ProfileScreen: React.FC = () => {
  const { user, updateProfile, isAdmin, isManager } = useAuth();
  const { groups } = useGroups();
  const { fontSize } = usePrefs();

  const [name, setName] = useState(user?.name ?? '');
  const [position, setPosition] = useState(user?.position ?? '');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const userGroupsLabel = useMemo(
    () =>
      (user.groupIds || [])
        .map(gId => groups.find(g => g.id === gId)?.name)
        .filter(Boolean)
        .join(', '),
    [user.groupIds, groups]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Błąd', 'Imię i nazwisko nie mogą być puste.');
      return;
    }

    if (!position.trim()) {
      Alert.alert('Błąd', 'Stanowisko nie może być puste.');
      return;
    }

    if (password || passwordRepeat) {
      if (password.length < 3) {
        Alert.alert(
          'Błąd',
          'Hasło powinno mieć co najmniej 3 znaki (demo).'
        );
        return;
      }
      if (password !== passwordRepeat) {
        Alert.alert('Błąd', 'Hasła nie są takie same.');
        return;
      }
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        position: position.trim(),
        password: password ? password : undefined,
      });
      setPassword('');
      setPasswordRepeat('');
      Alert.alert('Sukces', 'Profil został zapisany.');
    } catch (e) {
      console.warn('Failed to update profile', e);
      Alert.alert('Błąd', 'Nie udało się zapisać profilu.');
    } finally {
      setSaving(false);
    }
  };

  const rolesLabel = (user.roles || [])
    .map(r =>
      r === 'admin' ? 'Admin' : r === 'manager' ? 'Manager' : 'User'
    )
    .join(', ');

  return (
    <Screen>
      <View style={styles.container}>
        {/* Аватар + базова інфа */}
        <View style={styles.header}>
          <UserAvatar uri={user.avatar} label={user.name} size={72} />
          <View style={styles.headerText}>
            <Text
              style={[
                styles.name,
                { fontSize: scaleFont(18, fontSize) },
              ]}
            >
              {user.name}
            </Text>
            <Text
              style={[
                styles.position,
                { fontSize: scaleFont(12, fontSize) },
              ]}
            >
              {user.position || '—'}
            </Text>
            <Text
              style={[
                styles.meta,
                { fontSize: scaleFont(11, fontSize) },
              ]}
            >
              {user.email}
            </Text>
            <Text
              style={[
                styles.meta,
                { fontSize: scaleFont(11, fontSize) },
              ]}
            >
              Role: {rolesLabel || 'user'}
            </Text>
          </View>
        </View>

        {/* Інфо про групи/компанії */}
        <View style={styles.infoBox}>
          <Text
            style={[
              styles.infoTitle,
              { fontSize: scaleFont(13, fontSize) },
            ]}
          >
            Grupy:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { fontSize: scaleFont(12, fontSize) },
            ]}
          >
            {userGroupsLabel || 'Brak przypisanych grup'}
          </Text>

          <Text
            style={[
              styles.infoTitle,
              { fontSize: scaleFont(13, fontSize), marginTop: 6 },
            ]}
          >
            Firmy:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { fontSize: scaleFont(12, fontSize) },
            ]}
          >
            {user.companyIds && user.companyIds.length > 0
              ? user.companyIds.join(', ')
              : 'Brak przypisanych firm'}
          </Text>
        </View>

        {/* Форма редагування */}
        <View style={styles.form}>
          <Text
            style={[
              styles.formTitle,
              { fontSize: scaleFont(15, fontSize) },
            ]}
          >
            Edycja profilu
          </Text>

          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(13, fontSize) },
            ]}
            placeholder="Imię i nazwisko"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(13, fontSize) },
            ]}
            placeholder="Stanowisko"
            placeholderTextColor={colors.textMuted}
            value={position}
            onChangeText={setPosition}
          />

          <Text
            style={[
              styles.passwordLabel,
              { fontSize: scaleFont(12, fontSize) },
            ]}
          >
            Zmiana hasła (opcjonalnie)
          </Text>

          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(13, fontSize) },
            ]}
            placeholder="Nowe hasło"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={[
              styles.input,
              { fontSize: scaleFont(13, fontSize) },
            ]}
            placeholder="Powtórz hasło"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={passwordRepeat}
            onChangeText={setPasswordRepeat}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text
              style={[
                styles.saveButtonText,
                { fontSize: scaleFont(14, fontSize) },
              ]}
            >
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
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
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  position: {
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    color: colors.textMuted,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.textMuted,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  formTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginBottom: 6,
  },
  passwordLabel: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
