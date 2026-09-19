export interface SurfaceGlowEffect {
  enabled: boolean;
  color: string;
  opacity: number; // e.g. 0.0 to 1.0 (or percentage 0 to 100)
  blur: number; // in pixels, e.g. 0 to 40
  spread: number; // in pixels, e.g. 0 to 20
}

export interface ThemeEffects {
  surfaceGlow?: SurfaceGlowEffect;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    surfaceCard: string;
    border: string;
    borderHighlight: string;
    // Semantic Text Tokens
    text: string; // High contrast primary text
    textPrimary: string;
    textSecondary: string; // Readable medium-contrast secondary text
    textMuted: string; // Readable supporting text (WCAG AA compliant)
    textDisabled: string;
    textOnPrimary: string;
    textOnDark: string;
    textOnDarkSecondary: string;
    textOnDarkMuted: string;
    textOnCard: string;
    // Brand & Action Colors
    primary: string;
    primaryHover: string;
    primaryText: string;
    secondary: string;
    secondaryHover: string;
    accentGold: string;
    accentEmerald: string;
    accentRose: string;
    progressTrack: string;
    cardShadow: string;
  };
  effects?: ThemeEffects;
}

export const PRESET_THEMES: Record<string, ThemeDefinition> = {
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant Palette',
    description: 'Energetic Duolingo & RPG palette with electric indigo, emerald, orange & gold accents',
    isDark: false,
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceAlt: '#f1f5f9',
      surfaceCard: '#ffffff',
      border: '#cbd5e1',
      borderHighlight: '#94a3b8',
      text: '#0f172a',
      textPrimary: '#0f172a',
      textSecondary: '#334155', // Slate 700 - high readability
      textMuted: '#475569', // Slate 600 - distinct and accessible
      textDisabled: '#94a3b8',
      textOnPrimary: '#ffffff',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#e2e8f0',
      textOnDarkMuted: '#cbd5e1',
      textOnCard: '#0f172a',
      primary: '#f97316', // Vibrant Orange
      primaryHover: '#ea580c',
      primaryText: '#ffffff',
      secondary: '#6366f1', // Vibrant Indigo
      secondaryHover: '#4f46e5',
      accentGold: '#d97706', // Amber 600
      accentEmerald: '#059669', // Emerald 600
      accentRose: '#e11d48', // Rose 600
      progressTrack: '#e2e8f0',
      cardShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
    },
    effects: {
      surfaceGlow: {
        enabled: false,
        color: '#f97316',
        opacity: 0.15,
        blur: 14,
        spread: 1,
      },
    },
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura (FREE)',
    description: 'Tema bunga sakura Jepang dengan nuansa kelopak mawar lembut, aksen ceri, dan teks berdaya baca tinggi',
    isDark: false,
    colors: {
      bg: '#fff5f7',
      surface: '#ffffff',
      surfaceAlt: '#fce7f3',
      surfaceCard: '#ffffff',
      border: '#fbcfe8',
      borderHighlight: '#f472b6',
      text: '#1e1b4b',
      textPrimary: '#1e1b4b',
      textSecondary: '#374151',
      textMuted: '#4b5563',
      textDisabled: '#9ca3af',
      textOnPrimary: '#ffffff',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#fce7f3',
      textOnDarkMuted: '#fbcfe8',
      textOnCard: '#1e1b4b',
      primary: '#ec4899', // Rose/Pink
      primaryHover: '#db2777',
      primaryText: '#ffffff',
      secondary: '#e11d48', // Deep Rose
      secondaryHover: '#be123c',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#f43f5e',
      progressTrack: '#fbcfe8',
      cardShadow: '0 4px 16px -2px rgba(236, 72, 153, 0.08), 0 2px 6px -2px rgba(236, 72, 153, 0.04)',
    },
    effects: {
      surfaceGlow: {
        enabled: true,
        color: '#ec4899',
        opacity: 0.28,
        blur: 18,
        spread: 2,
      },
    },
  },
  fresh: {
    id: 'fresh',
    name: 'Fresh Mint',
    description: 'Clean, professional light theme with vibrant mint & emerald energy',
    isDark: false,
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceAlt: '#f1f5f9',
      surfaceCard: '#ffffff',
      border: '#cbd5e1',
      borderHighlight: '#94a3b8',
      text: '#0f172a',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#475569',
      textDisabled: '#94a3b8',
      textOnPrimary: '#ffffff',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#e2e8f0',
      textOnDarkMuted: '#cbd5e1',
      textOnCard: '#0f172a',
      primary: '#0284c7', // Sky Blue
      primaryHover: '#0369a1',
      primaryText: '#ffffff',
      secondary: '#0d9488', // Teal
      secondaryHover: '#0f766e',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#e2e8f0',
      cardShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
    },
    effects: {
      surfaceGlow: {
        enabled: false,
        color: '#0284c7',
        opacity: 0.15,
        blur: 12,
        spread: 1,
      },
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Sleek dark navy & obsidian theme with crisp glowing gold accents',
    isDark: true,
    colors: {
      bg: '#090d16',
      surface: '#111827',
      surfaceAlt: '#1e293b',
      surfaceCard: '#111827',
      border: '#293548',
      borderHighlight: '#475569',
      text: '#f8fafc',
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0', // Slate 200
      textMuted: '#cbd5e1', // Slate 300 - high contrast on dark
      textDisabled: '#64748b',
      textOnPrimary: '#090d16',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#e2e8f0',
      textOnDarkMuted: '#cbd5e1',
      textOnCard: '#ffffff',
      primary: '#38bdf8', // Cyan Blue
      primaryHover: '#0ea5e9',
      primaryText: '#090d16',
      secondary: '#a855f7', // Violet
      secondaryHover: '#9333ea',
      accentGold: '#fbbf24',
      accentEmerald: '#34d399',
      accentRose: '#fb7185',
      progressTrack: '#334155',
      cardShadow: '0 6px 20px -4px rgba(0, 0, 0, 0.6)',
    },
    effects: {
      surfaceGlow: {
        enabled: false,
        color: '#38bdf8',
        opacity: 0.2,
        blur: 16,
        spread: 1,
      },
    },
  },
  bounty: {
    id: 'bounty',
    name: 'Bounty',
    description: 'Classic pirate bounty parchment & warm gold adventure theme',
    isDark: false,
    colors: {
      bg: '#fdf8f0',
      surface: '#ffffff',
      surfaceAlt: '#f5e9da',
      surfaceCard: '#ffffff',
      border: '#decab2',
      borderHighlight: '#bfa487',
      text: '#261a0e',
      textPrimary: '#261a0e',
      textSecondary: '#4a3824',
      textMuted: '#6e563d',
      textDisabled: '#9e8972',
      textOnPrimary: '#ffffff',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#f5e9da',
      textOnDarkMuted: '#decab2',
      textOnCard: '#261a0e',
      primary: '#d97706', // Warm Amber
      primaryHover: '#b45309',
      primaryText: '#ffffff',
      secondary: '#1e3a8a', // Deep Pirate Navy
      secondaryHover: '#172554',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#ebd8c3',
      cardShadow: '0 4px 14px -2px rgba(41, 30, 19, 0.08)',
    },
    effects: {
      surfaceGlow: {
        enabled: false,
        color: '#d97706',
        opacity: 0.2,
        blur: 14,
        spread: 1,
      },
    },
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    description: 'High-energy futuristic neon synthwave with electric purple & amber',
    isDark: true,
    colors: {
      bg: '#0b0b14',
      surface: '#141424',
      surfaceAlt: '#21213b',
      surfaceCard: '#141424',
      border: '#36365f',
      borderHighlight: '#585892',
      text: '#f1f5f9',
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#cbd5e1',
      textDisabled: '#64748b',
      textOnPrimary: '#ffffff',
      textOnDark: '#ffffff',
      textOnDarkSecondary: '#e2e8f0',
      textOnDarkMuted: '#cbd5e1',
      textOnCard: '#ffffff',
      primary: '#ec4899', // Neon Pink
      primaryHover: '#db2777',
      primaryText: '#ffffff',
      secondary: '#06b6d4', // Neon Cyan
      secondaryHover: '#0891b2',
      accentGold: '#facc15',
      accentEmerald: '#10b981',
      accentRose: '#f43f5e',
      progressTrack: '#2e2e54',
      cardShadow: '0 6px 20px -2px rgba(236, 72, 153, 0.15)',
    },
    effects: {
      surfaceGlow: {
        enabled: true,
        color: '#ec4899',
        opacity: 0.32,
        blur: 20,
        spread: 2,
      },
    },
  },
};
