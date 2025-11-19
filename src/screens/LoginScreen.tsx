// src/screens/LoginScreen.tsx
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const { fontSize } = usePrefs();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Błąd logowania', e.message ?? 'Coś poszło nie tak');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(24, fontSize) }]}>
          USOS dla Pracowników
        </Text>
        <Text style={[styles.subtitle, { fontSize: scaleFont(14, fontSize) }]}>
          Zaloguj się do swojego konta
        </Text>

        <View style={styles.card}>
          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Email
          </Text>
          <TextInput
            style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
            placeholder="name@firma.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { fontSize: scaleFont(12, fontSize) }]}>
            Hasło
          </Text>
          <TextInput
            style={[styles.input, { fontSize: scaleFont(14, fontSize) }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={onLogin}>
            <Text style={[styles.buttonText, { fontSize: scaleFont(14, fontSize) }]}>
              Zaloguj
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text
              style={[
                styles.linkText,
                { fontSize: scaleFont(12, fontSize) },
              ]}
            >
              Nie masz konta? Zarejestruj się
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

export default LoginScreen;

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
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
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
