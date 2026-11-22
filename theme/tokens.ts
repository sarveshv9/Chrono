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
      surface: '#0D0E11',
      surfaceElevated: '#16181D',
      surfaceBorder: 'rgba(255, 255, 255, 0.08)',
      textPrimary: '#F6F6F8',
      textSecondary: '#8E919A',
      textMuted: '#4F525B',
      accentFocus: '#FF5436',       // Warm Vermillion
      accentShortBreak: '#30D158',  // Apple Emerald Mint
      accentLongBreak: '#4DA2FF',   // Calm Arctic Blue
      accentActive: '#FF5436',
      progressTrack: '#16171B',
      progressFill: '#FF5436',
      cardBg: '#121418',
      danger: '#FF453A',
      glassBg: 'rgba(255, 255, 255, 0.05)',
    },
  },
  papyrus: {
    name: 'Warm Papyrus',
    isDark: false,
    colors: {
      background: '#F9F6F0',
      surface: '#F1ECE1',
      surfaceElevated: '#E8E1D3',
      surfaceBorder: 'rgba(58, 46, 36, 0.09)',
      textPrimary: '#241D17',
      textSecondary: '#63564A',
      textMuted: '#96887B',
      accentFocus: '#BD532B',       // Terracotta Clay
      accentShortBreak: '#3B7358',  // Forest Sage
      accentLongBreak: '#265D82',   // Muted Ink Navy
      accentActive: '#BD532B',
      progressTrack: '#E4DDD0',
      progressFill: '#BD532B',
      cardBg: '#ECE5D8',
      danger: '#C93B2B',
      glassBg: 'rgba(0, 0, 0, 0.04)',
    },
  },
  neon: {
    name: 'Cyber Neon',
    isDark: true,
    colors: {
      background: '#07090E',
      surface: '#0E131C',
      surfaceElevated: '#171E2D',
      surfaceBorder: 'rgba(0, 255, 204, 0.15)',
      textPrimary: '#F1F6FD',
      textSecondary: '#9AA4B5',
      textMuted: '#4C5567',
      accentFocus: '#FF1A75',       // Neon Magenta
      accentShortBreak: '#00F5D4',  // Electric Aqua
      accentLongBreak: '#9D4EDD',   // Synthwave Purple
      accentActive: '#FF1A75',
      progressTrack: '#121926',
      progressFill: '#00F5D4',
      cardBg: '#111724',
      danger: '#FF3366',
      glassBg: 'rgba(0, 255, 204, 0.06)',
    },
  },
  matcha: {
    name: 'Matcha Calm',
    isDark: true,
    colors: {
      background: '#101712',
      surface: '#17221A',
      surfaceElevated: '#202F24',
      surfaceBorder: 'rgba(110, 155, 120, 0.12)',
      textPrimary: '#E8F2EA',
      textSecondary: '#9CB4A1',
      textMuted: '#586E5E',
      accentFocus: '#6EB980',       // Fresh Matcha Leaf
      accentShortBreak: '#D8B18A',  // Roasted Hojicha
      accentLongBreak: '#5EA272',   // Deep Bamboo
      accentActive: '#6EB980',
      progressTrack: '#1A271E',
      progressFill: '#6EB980',
      cardBg: '#1C2920',
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
