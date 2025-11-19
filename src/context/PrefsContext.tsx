// src/context/PrefsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontSizePref } from '../utils/scaleFont';

interface PrefsContextValue {
  darkMode: boolean;
  fontSize: FontSizePref;
  setDarkMode: (value: boolean) => void;
  setFontSize: (value: FontSizePref) => void;
}

const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);
const PREFS_KEY = '@prefs';

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkModeState] = useState(true);
  const [fontSize, setFontSizeState] = useState<FontSizePref>('normal');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.darkMode === 'boolean') setDarkModeState(parsed.darkMode);
          if (parsed.fontSize) setFontSizeState(parsed.fontSize);
        }
      } catch (e) {
        console.warn('Failed to load prefs', e);
      }
    })();
  }, []);

  const persist = async (next: { darkMode: boolean; fontSize: FontSizePref }) => {
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save prefs', e);
    }
  };

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);
    persist({ darkMode: value, fontSize });
  };

  const setFontSize = (value: FontSizePref) => {
    setFontSizeState(value);
    persist({ darkMode, fontSize: value });
  };

  return (
    <PrefsContext.Provider value={{ darkMode, fontSize, setDarkMode, setFontSize }}>
      {children}
    </PrefsContext.Provider>
  );
};

export const usePrefs = () => {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
};
