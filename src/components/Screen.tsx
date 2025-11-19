// src/components/Screen.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePrefs } from '../context/PrefsContext';
import { colors } from '../theme/colors';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const Screen: React.FC<ScreenProps> = ({ children, style }) => {
  const { darkMode } = usePrefs();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? colors.background : '#ffffff' },
        style,
      ]}
    >
      <StatusBar hidden />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
