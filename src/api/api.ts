// src/api/api.ts
import axios from 'axios';
import { Platform } from 'react-native';

const emulatorAndroid = 'http://10.0.2.2:8083';
const emulatorIOS = 'http://localhost:8083';
// !!! заміни IP на IP свого ПК у локальній мережі
const lanPC = 'http://192.168.0.100:8083';

export const API_BASE_URL = Platform.select({
  ios: emulatorIOS,
  android: emulatorAndroid,
  default: lanPC,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});
