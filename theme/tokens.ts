export type ThemePreset = 'oled' | 'papyrus' | 'neon' | 'matcha';

export interface ThemeColors {
  background: string;
  surface: string;
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
}

export const THEMES: Record<ThemePreset, { name: string; isDark: boolean; colors: ThemeColors }> = {
  oled: {
    name: 'OLED Obsidian',
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#111113',
      surfaceBorder: '#222226',
      textPrimary: '#F5F5F7',
      textSecondary: '#8E8E93',
      textMuted: '#545458',
      accentFocus: '#FF453A',
      accentShortBreak: '#30D158',
      accentLongBreak: '#0A84FF',
      accentActive: '#FF453A',
      progressTrack: '#1C1C1E',
      progressFill: '#FF453A',
      cardBg: '#161618',
    },
  },
  papyrus: {
    name: 'Warm Papyrus',
    isDark: false,
    colors: {
      background: '#FBF8F2',
      surface: '#F2EDE2',
      surfaceBorder: '#E6DECE',
      textPrimary: '#2C2825',
      textSecondary: '#70665D',
      textMuted: '#A0978C',
      accentFocus: '#B85D36',
      accentShortBreak: '#4B7B61',
      accentLongBreak: '#2A5D8A',
      accentActive: '#B85D36',
      progressTrack: '#E8E1D3',
      progressFill: '#B85D36',
      cardBg: '#F5EFE4',
    },
  },
  neon: {
    name: 'Cyber Neon',
    isDark: true,
    colors: {
      background: '#080B10',
      surface: '#101522',
      surfaceBorder: '#1E2840',
      textPrimary: '#F0F6FC',
      textSecondary: '#8B949E',
      textMuted: '#484F58',
      accentFocus: '#FF0055',
      accentShortBreak: '#00FFCC',
      accentLongBreak: '#7928CA',
      accentActive: '#FF0055',
      progressTrack: '#161B22',
      progressFill: '#00FFCC',
      cardBg: '#0F1420',
    },
  },
  matcha: {
    name: 'Matcha Calm',
    isDark: true,
    colors: {
      background: '#131914',
      surface: '#1B241D',
      surfaceBorder: '#27342A',
      textPrimary: '#E2EBE4',
      textSecondary: '#8B9E8F',
      textMuted: '#586A5C',
      accentFocus: '#7BC28C',
      accentShortBreak: '#C7A57F',
      accentLongBreak: '#5E9770',
      accentActive: '#7BC28C',
      progressTrack: '#1E2B20',
      progressFill: '#7BC28C',
      cardBg: '#172219',
    },
  },
};
