// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AuthStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const { fontSize } = usePrefs();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      Alert.alert('Błąd rejestracji', e.message ?? 'Coś poszło nie tak');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(24, fontSize) }]}>
          Rejestracja
        </Text>

        <View style={styles.card}>
          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Imię i nazwisko
          </Text>
          <TextInput
            style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
            value={name}
            onChangeText={setName}
            placeholder="Jan Kowalski"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Email
          </Text>
          <TextInput
            style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@firma.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Hasło
          </Text>
          <TextInput
            style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.button} onPress={onRegister}>
            <Text style={[styles.buttonText, { fontSize: scaleFont(14, fontSize) }]}>
              Zarejestruj
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text
              style={[
                styles.linkText,
                { fontSize: scaleFont(12, fontSize) },
              ]}
            >
              Masz już konto? Zaloguj się
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
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
  linkText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
