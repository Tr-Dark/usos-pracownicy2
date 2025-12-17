import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { colors } from '../theme/colors';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable, type } = useNetwork();
  const { fontSize } = usePrefs();

  const offline = !isConnected || !isInternetReachable;
  if (!offline) return null;

  const labelType =
    type === 'wifi' ? 'Wi-Fi' : type === 'cellular' ? 'Mobile' : 'Network';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { fontSize: scaleFont(12, fontSize) }]}>
        Brak internetu ({labelType}). Niektóre funkcje mogą nie działać.
      </Text>

      <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.btn}>
        <Text style={[styles.btnText, { fontSize: scaleFont(12, fontSize) }]}>
          Ustawienia
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#2a0f12',
  },
  text: {
    color: '#ffd3d3',
    flex: 1,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnText: {
    color: '#0b1120',
    fontWeight: '700',
  },
});
