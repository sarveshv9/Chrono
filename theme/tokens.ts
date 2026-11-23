export type ThemePreset = 'system' | 'oled' | 'papyrus' | 'neon' | 'matcha';

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

export const THEME_DEFINITIONS: Record<Exclude<ThemePreset, 'system'>, { name: string; isDark: boolean; colors: ThemeColors }> = {
  oled: {
    name: 'OLED Obsidian',
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#111113',
      surfaceElevated: '#18181B',
      surfaceBorder: '#242429',
      textPrimary: '#F5F5F7',
      textSecondary: '#A1A1A6',
      textMuted: '#636366',
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
  papyrus: {
    name: 'Warm Papyrus',
    isDark: false,
    colors: {
      background: '#F9F6F0',
      surface: '#F0EBE0',
      surfaceElevated: '#E5DED0',
      surfaceBorder: '#DFD7C8',
      textPrimary: '#201A15',
      textSecondary: '#5A5046',
      textMuted: '#8C8276',
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
  neon: {
    name: 'Cyber Neon',
    isDark: true,
    colors: {
      background: '#080B10',
      surface: '#0F1420',
      surfaceElevated: '#161B26',
      surfaceBorder: '#1E2840',
      textPrimary: '#F0F6FC',
      textSecondary: '#9CA3AF',
      textMuted: '#4B5563',
      accentFocus: '#FF0055',
      accentShortBreak: '#00FFCC',
      accentLongBreak: '#7928CA',
      accentActive: '#FF0055',
      progressTrack: '#161B26',
      progressFill: '#00FFCC',
      cardBg: '#131A2A',
      danger: '#FF2E54',
      glassBg: 'rgba(0, 255, 204, 0.06)',
    },
  },
  matcha: {
    name: 'Matcha Calm',
    isDark: true,
    colors: {
      background: '#111813',
      surface: '#18221B',
      surfaceElevated: '#1E2B21',
      surfaceBorder: '#27382C',
      textPrimary: '#E8F1EA',
      textSecondary: '#9BB2A0',
      textMuted: '#5F7564',
      accentFocus: '#69B67C',
      accentShortBreak: '#D1AC84',
      accentLongBreak: '#529668',
      accentActive: '#69B67C',
      progressTrack: '#1E2B21',
      progressFill: '#69B67C',
      cardBg: '#1D2A20',
      danger: '#E5534B',
      glassBg: 'rgba(110, 185, 128, 0.07)',
    },
  },
};

export function resolveThemeColors(preset: ThemePreset, systemColorScheme: 'light' | 'dark' | null | undefined): { name: string; isDark: boolean; colors: ThemeColors } {
  if (preset === 'system') {
    return systemColorScheme === 'light'
      ? { ...THEME_DEFINITIONS.papyrus, name: 'Follow System (Light)' }
      : { ...THEME_DEFINITIONS.oled, name: 'Follow System (Dark)' };
  }
  return THEME_DEFINITIONS[preset];
}
