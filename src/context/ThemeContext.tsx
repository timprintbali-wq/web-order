import React, { createContext, useContext, useEffect, useState } from 'react';

import { PRESET_THEMES, ThemeDefinition } from '../types/theme';

import { soundEffects } from '../utils/soundEffects';

import { useAuth } from './AuthContext';



interface ThemeContextType {

  currentTheme: ThemeDefinition;

  themeId: string;

  setTheme: (themeId: string) => void;

  previewTheme: ThemeDefinition | null;

  setPreviewTheme: (theme: ThemeDefinition | null) => void;

  customThemes: Record<string, ThemeDefinition>;

  allThemes: Record<string, ThemeDefinition>;

  saveCustomTheme: (theme: ThemeDefinition) => void;

  deleteCustomTheme: (themeId: string) => void;

  soundMuted: boolean;

  toggleSound: () => void;

}



const ThemeContext = createContext<ThemeContextType | undefined>(undefined);



const THEME_STORAGE_KEY = 'bpc_bounty_theme_id';

const CUSTOM_THEMES_KEY = 'bpc_bounty_custom_themes';

const SOUND_STORAGE_KEY = 'bpc_bounty_sound_muted';



export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Tema akun yang lagi login — ini yang udah sinkron real-time lewat

  // Firestore (equippedTheme di dokumen user). Kalau ada nilainya, ini jadi

  // "sumber kebenaran" tema aktif, supaya semua tab dengan akun yang sama

  // otomatis kompak, bukan cuma nyangkut di localStorage tiap browser/tab.

  const { currentUser, equipUserCosmetic } = useAuth();



  // localStorage tetap dipakai sebagai FALLBACK untuk kondisi belum login /

  // akun belum pernah pasang tema apapun (equippedTheme kosong).

  const [localThemeId, setLocalThemeId] = useState<string>(() => {

    return localStorage.getItem(THEME_STORAGE_KEY) || 'vibrant';

  });



  const themeId = currentUser?.equippedTheme || localThemeId;



  const [previewTheme, setPreviewTheme] = useState<ThemeDefinition | null>(null);



  const [customThemes, setCustomThemes] = useState<Record<string, ThemeDefinition>>(() => {

    try {

      const saved = localStorage.getItem(CUSTOM_THEMES_KEY);

      return saved ? JSON.parse(saved) : {};

    } catch {

      return {};

    }

  });



  // Listen for storage or catalog update events to keep theme catalog completely synchronized

  useEffect(() => {

    const handleSync = () => {

      try {

        const saved = localStorage.getItem(CUSTOM_THEMES_KEY);

        if (saved) {

          setCustomThemes(JSON.parse(saved));

        }

      } catch (e) {

        console.error('Failed to sync custom themes:', e);

      }

    };



    window.addEventListener('storage', handleSync);

    window.addEventListener('bpc_theme_catalog_updated', handleSync);

    return () => {

      window.removeEventListener('storage', handleSync);

      window.removeEventListener('bpc_theme_catalog_updated', handleSync);

    };

  }, []);



  const [soundMuted, setSoundMuted] = useState<boolean>(() => {

    return localStorage.getItem(SOUND_STORAGE_KEY) === 'true';

  });



  const allThemes: Record<string, ThemeDefinition> = { ...PRESET_THEMES, ...customThemes };



  const resolveTheme = (id: string): ThemeDefinition => {

    if (allThemes[id]) return allThemes[id];

    const stripped = id.replace(/^theme_/, '');

    if (allThemes[stripped]) return allThemes[stripped];

    const prefixed = `theme_${id}`;

    if (allThemes[prefixed]) return allThemes[prefixed];

    const found = Object.values(allThemes).find(

      t => t.id === id || t.id === stripped || t.id === prefixed || `theme_${t.id}` === id

    );

    if (found) return found;

    return PRESET_THEMES.vibrant;

  };



  const activeTheme = previewTheme || resolveTheme(themeId);



  // Apply CSS variables & Surface Glow effects to root

  useEffect(() => {

    const root = document.documentElement;

    const { colors, isDark, effects } = activeTheme;



    if (isDark) {

      root.classList.add('dark');

    } else {

      root.classList.remove('dark');

    }



    root.style.setProperty('--color-bg', colors.bg);

    root.style.setProperty('--color-surface', colors.surface);

    root.style.setProperty('--color-surface-alt', colors.surfaceAlt);

    root.style.setProperty('--color-surface-card', colors.surfaceCard || colors.surface);

    root.style.setProperty('--color-border', colors.border);

    root.style.setProperty('--color-border-highlight', colors.borderHighlight);



    // Semantic typography tokens

    const textPrimary = colors.textPrimary || colors.text;

    const textSecondary = colors.textSecondary || (isDark ? '#e2e8f0' : '#334155');

    const textMuted = colors.textMuted || (isDark ? '#cbd5e1' : '#475569');

    const textOnDark = colors.textOnDark || '#ffffff';

    const textOnDarkSecondary = colors.textOnDarkSecondary || '#e2e8f0';

    const textOnDarkMuted = colors.textOnDarkMuted || '#cbd5e1';



    root.style.setProperty('--color-text', textPrimary);

    root.style.setProperty('--text-primary', textPrimary);

    root.style.setProperty('--color-text-secondary', textSecondary);

    root.style.setProperty('--text-secondary', textSecondary);

    root.style.setProperty('--color-text-muted', textMuted);

    root.style.setProperty('--text-muted', textMuted);

    root.style.setProperty('--text-disabled', colors.textDisabled || (isDark ? '#64748b' : '#94a3b8'));

    root.style.setProperty('--text-on-primary', colors.textOnPrimary || '#ffffff');

    root.style.setProperty('--text-on-dark', textOnDark);

    root.style.setProperty('--text-on-dark-secondary', textOnDarkSecondary);

    root.style.setProperty('--text-on-dark-muted', textOnDarkMuted);

    root.style.setProperty('--text-on-card', colors.textOnCard || textPrimary);

    root.style.setProperty('--text-accent', colors.primary);

    root.style.setProperty('--text-success', colors.accentEmerald);

    root.style.setProperty('--text-warning', colors.accentGold);

    root.style.setProperty('--text-danger', colors.accentRose);



    // Brand and functional tokens

    root.style.setProperty('--color-primary', colors.primary);

    root.style.setProperty('--color-primary-hover', colors.primaryHover);

    root.style.setProperty('--color-primary-text', colors.primaryText || '#ffffff');

    root.style.setProperty('--color-secondary', colors.secondary);

    root.style.setProperty('--color-secondary-hover', colors.secondaryHover);

    root.style.setProperty('--color-gold', colors.accentGold);

    root.style.setProperty('--color-emerald', colors.accentEmerald);

    root.style.setProperty('--color-rose', colors.accentRose);

    root.style.setProperty('--color-progress-track', colors.progressTrack || (isDark ? '#334155' : '#e2e8f0'));



    // Surface / Outer Glow Effect computation

    const baseCardShadow = colors.cardShadow || '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)';

    const glow = effects?.surfaceGlow;



    if (glow && glow.enabled && glow.opacity > 0) {

      const hex = (glow.color || colors.primary || '#ec4899').replace('#', '');

      const r = parseInt(hex.substring(0, 2), 16) || 0;

      const g = parseInt(hex.substring(2, 4), 16) || 0;

      const b = parseInt(hex.substring(4, 6), 16) || 0;

      const alpha = Math.min(1, Math.max(0, glow.opacity > 1 ? glow.opacity / 100 : glow.opacity));

      const glowRgba = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;

      const blurPx = Math.max(0, Number(glow.blur) || 16);

      const spreadPx = Math.max(0, Number(glow.spread) || 2);

      const glowShadow = `0 0 ${blurPx}px ${spreadPx}px ${glowRgba}`;



      root.style.setProperty('--theme-surface-glow', glowShadow);

      root.style.setProperty('--theme-glow-color', glowRgba);

      root.style.setProperty('--theme-glow-blur', `${blurPx}px`);

      root.style.setProperty('--theme-glow-spread', `${spreadPx}px`);

      root.style.setProperty('--card-shadow', `${baseCardShadow}, ${glowShadow}`);

    } else {

      root.style.setProperty('--theme-surface-glow', 'none');

      root.style.setProperty('--theme-glow-color', 'transparent');

      root.style.setProperty('--theme-glow-blur', '0px');

      root.style.setProperty('--theme-glow-spread', '0px');

      root.style.setProperty('--card-shadow', baseCardShadow);

    }



    document.body.style.backgroundColor = colors.bg;

    document.body.style.color = textPrimary;

  }, [activeTheme]);



  useEffect(() => {

    soundEffects.setMuted(soundMuted);

    localStorage.setItem(SOUND_STORAGE_KEY, String(soundMuted));

  }, [soundMuted]);



  const setTheme = (id: string) => {

    setLocalThemeId(id);

    localStorage.setItem(THEME_STORAGE_KEY, id);

    setPreviewTheme(null);

    // Kalau lagi login, pasang juga ke akun (equippedTheme) — ini yang bikin

    // tema kepilih ini otomatis "nyebrang" ke tab/device lain dengan akun

    // yang sama, lewat sinkronisasi Firestore yang udah jalan.

    if (currentUser) {

      equipUserCosmetic('Theme', id);

    }

  };



  const saveCustomTheme = (theme: ThemeDefinition) => {

    const updated = { ...customThemes, [theme.id]: theme };

    setCustomThemes(updated);

    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));

  };



  const deleteCustomTheme = (themeIdToDelete: string) => {

    const updated = { ...customThemes };

    delete updated[themeIdToDelete];

    delete updated[themeIdToDelete.replace(/^theme_/, '')];

    setCustomThemes(updated);

    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));

  };



  const toggleSound = () => {

    setSoundMuted(prev => !prev);

  };



  return (

    <ThemeContext.Provider

      value={{

        currentTheme: activeTheme,

        themeId,

        setTheme,

        previewTheme,

        setPreviewTheme,

        customThemes,

        allThemes,

        saveCustomTheme,

        deleteCustomTheme,

        soundMuted,

        toggleSound,

      }}

    >

      {children}

    </ThemeContext.Provider>

  );

};



export const useTheme = (): ThemeContextType => {

  const context = useContext(ThemeContext);

  if (!context) {

    throw new Error('useTheme must be used within a ThemeProvider');

  }

  return context;

};