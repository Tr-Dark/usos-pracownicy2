// src/api/api.ts
import axios from "axios";
import { Platform } from "react-native";
import * as Device from "expo-device";

const PORT = 8083;

const LAN = `http://192.168.1.12:${PORT}`;
const ANDROID_EMULATOR = `http://10.0.2.2:${PORT}`;
const IOS_SIMULATOR = `http://localhost:${PORT}`;

export const API_BASE_URL =
  Platform.OS === "android"
    ? (Device.isDevice ? LAN : ANDROID_EMULATOR)
    : (Device.isDevice ? LAN : IOS_SIMULATOR);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});
