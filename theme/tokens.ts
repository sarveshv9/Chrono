export type ThemePreset = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentFocus: string;
  accentShortBreak: string;
  accentLongBreak: string;
  accentActive: string;
  progressTrack: string;
  progressFill: string;
  cardBg: string;
  danger: string;
  glassBg: string;
}

export const THEME_DEFINITIONS: Record<ThemePreset, { name: string; isDark: boolean; colors: ThemeColors }> = {
  dark: {
    name: 'Dark',
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#111113',
      surfaceElevated: '#18181B',
      surfaceBorder: '#242429',
      textPrimary: '#F5F5F7',
      textSecondary: '#A1A1A6',
      textMuted: '#828287',
      accentFocus: '#FF453A',
      accentShortBreak: '#30D158',
      accentLongBreak: '#0A84FF',
      accentActive: '#FF453A',
      progressTrack: '#1C1C1E',
      progressFill: '#FF453A',
      cardBg: '#18181B',
      danger: '#FF3B30',
      glassBg: 'rgba(255, 255, 255, 0.05)',
    },
  },
  light: {
    name: 'Light',
    isDark: false,
    colors: {
      background: '#F9F6F0',
      surface: '#F0EBE0',
      surfaceElevated: '#E5DED0',
      surfaceBorder: '#DFD7C8',
      textPrimary: '#201A15',
      textSecondary: '#5A5046',
      textMuted: '#6E655B',
      accentFocus: '#C2542B',
      accentShortBreak: '#386B52',
      accentLongBreak: '#1F537E',
      accentActive: '#C2542B',
      progressTrack: '#E5DED0',
      progressFill: '#C2542B',
      cardBg: '#ECE4D6',
      danger: '#D93829',
      glassBg: 'rgba(0, 0, 0, 0.04)',
    },
  },
};

export function resolveThemeColors(preset: ThemePreset): { name: string; isDark: boolean; colors: ThemeColors } {
  return preset === 'light' ? THEME_DEFINITIONS.light : THEME_DEFINITIONS.dark;
}
