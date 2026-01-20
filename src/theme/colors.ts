// src/theme/colors.ts
export type AppColors = {
  background: string;
  card: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  inputBg: string;

  onAccent: string;
};

const dark: AppColors = {
  background: '#020617',
  card: '#0f172a',
  accent: '#38bdf8',
  accentSoft: '#0ea5e9',
  text: '#e5e7eb',
  textMuted: '#94a3b8',
  border: '#1e293b',
  danger: '#f97373',
  success: '#22c55e',
  inputBg: '#020617',

  onAccent: '#0b1120',
};

const light: AppColors = {
  background: '#f8fafc',
  card: '#ffffff',
  accent: '#0284c7',
  accentSoft: '#38bdf8',
  text: '#0f172a',
  textMuted: '#475569',
  border: '#e2e8f0',
  danger: '#dc2626',
  success: '#16a34a',
  inputBg: '#f1f5f9',

  onAccent: '#ffffff',
};

export const colors = dark;

export const getColors = (darkMode: boolean): AppColors =>
  darkMode ? dark : light;
