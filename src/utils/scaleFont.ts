// src/utils/scaleFont.ts
import { PixelRatio } from 'react-native';

export type FontSizePref = 'small' | 'normal' | 'large';

export const scaleFont = (baseSize: number, pref: FontSizePref = 'normal') => {
  const factor = pref === 'small' ? 0.9 : pref === 'large' ? 1.15 : 1;
  return PixelRatio.roundToNearestPixel(baseSize * factor);
};
