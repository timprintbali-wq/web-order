import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Upload,
  Check,
  Palette,
  Moon,
  Sun,
  Shield,
  Coins,
  RefreshCw,
  Sliders,
  Eye,
  Flame,
} from 'lucide-react';
import { CosmeticItem, CosmeticType, BountyRarity, CosmeticRarity } from '../../types';
import { ThemeDefinition } from '../../types/theme';
import { COSMETIC_RARITY_LIST, getRarityConfig } from '../../utils/rarityConfig';
import { ProfileTitleBadge } from '../common/ProfileTitleBadge';
import { BpcCoinIcon } from '../common/BpcCoinIcon';
import { useTheme } from '../../context/ThemeContext';

interface ForgeCosmeticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<CosmeticItem>, isEdit: boolean, cosmeticId?: string) => void;
  itemToEdit?: CosmeticItem | null;
  defaultCategory?: CosmeticType;
}

interface ThemeColorState {
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHighlight: string;
  accentGold: string;
  accentEmerald: string;
  accentRose: string;
  progressTrack: string;
}

const STARTER_TEMPLATES: Array<{
  name: string;
  isDark: boolean;
  colors: ThemeColorState;
  glow?: {
    enabled: boolean;
    color: string;
    opacity: number;
    blur: number;
    spread: number;
  };
}> = [
  {
    name: 'Vibrant Orange (Light)',
    isDark: false,
    colors: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      primaryText: '#ffffff',
      secondary: '#6366f1',
      secondaryHover: '#4f46e5',
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceAlt: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#475569',
      border: '#cbd5e1',
      borderHighlight: '#94a3b8',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#e2e8f0',
    },
    glow: {
      enabled: false,
      color: '#f97316',
      opacity: 15,
      blur: 14,
      spread: 1,
    },
  },
  {
    name: 'Midnight Navy (Dark)',
    isDark: true,
    colors: {
      primary: '#38bdf8',
      primaryHover: '#0284c7',
      primaryText: '#ffffff',
      secondary: '#a855f7',
      secondaryHover: '#9333ea',
      bg: '#090d16',
      surface: '#111827',
      surfaceAlt: '#1e293b',
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#cbd5e1',
      border: '#293548',
      borderHighlight: '#38bdf8',
      accentGold: '#fbbf24',
      accentEmerald: '#34d399',
      accentRose: '#fb7185',
      progressTrack: '#334155',
    },
    glow: {
      enabled: false,
      color: '#38bdf8',
      opacity: 20,
      blur: 16,
      spread: 1,
    },
  },
  {
    name: 'Sakura Petal (Light)',
    isDark: false,
    colors: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryText: '#ffffff',
      secondary: '#f43f5e',
      secondaryHover: '#e11d48',
      bg: '#fff1f2',
      surface: '#ffffff',
      surfaceAlt: '#ffe4e6',
      textPrimary: '#881337',
      textSecondary: '#9f1239',
      textMuted: '#be123c',
      border: '#fecdd3',
      borderHighlight: '#fda4af',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#ffe4e6',
    },
    glow: {
      enabled: true,
      color: '#ec4899',
      opacity: 28,
      blur: 18,
      spread: 2,
    },
  },
  {
    name: 'Cyber Synthwave (Dark)',
    isDark: true,
    colors: {
      primary: '#ec4899',
      primaryHover: '#f43f5e',
      primaryText: '#ffffff',
      secondary: '#06b6d4',
      secondaryHover: '#0891b2',
      bg: '#0b0b14',
      surface: '#141424',
      surfaceAlt: '#21213b',
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#cbd5e1',
      border: '#36365f',
      borderHighlight: '#ec4899',
      accentGold: '#facc15',
      accentEmerald: '#10b981',
      accentRose: '#f43f5e',
      progressTrack: '#262642',
    },
    glow: {
      enabled: true,
      color: '#ec4899',
      opacity: 32,
      blur: 20,
      spread: 2,
    },
  },
  {
    name: 'Emerald Forest (Light)',
    isDark: false,
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryText: '#ffffff',
      secondary: '#d97706',
      secondaryHover: '#b45309',
      bg: '#f0fdf4',
      surface: '#ffffff',
      surfaceAlt: '#dcfce7',
      textPrimary: '#064e3b',
      textSecondary: '#166534',
      textMuted: '#15803d',
      border: '#bbf7d0',
      borderHighlight: '#86efac',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#dcfce7',
    },
    glow: {
      enabled: false,
      color: '#059669',
      opacity: 15,
      blur: 14,
      spread: 1,
    },
  },
  {
    name: 'Parchment Bounty (Warm)',
    isDark: false,
    colors: {
      primary: '#d97706',
      primaryHover: '#b45309',
      primaryText: '#ffffff',
      secondary: '#1e3a8a',
      secondaryHover: '#1e40af',
      bg: '#fdf8f0',
      surface: '#ffffff',
      surfaceAlt: '#f5e9da',
      textPrimary: '#261a0e',
      textSecondary: '#4a3824',
      textMuted: '#6b5438',
      border: '#decab2',
      borderHighlight: '#bba488',
      accentGold: '#d97706',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      progressTrack: '#edd9c2',
    },
    glow: {
      enabled: false,
      color: '#d97706',
      opacity: 20,
      blur: 14,
      spread: 1,
    },
  },
];

export const ForgeCosmeticModal: React.FC<ForgeCosmeticModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  defaultCategory = 'Profile Frame',
}) => {
  const { saveCustomTheme } = useTheme();
  const isEdit = !!itemToEdit;

  const [formData, setFormData] = useState<Partial<CosmeticItem>>({
    name: '',
    description: '',
    type: defaultCategory,
    rarity: 'Common',
    assetUrl: '',
    previewAssetUrl: '',
    bpcPrice: 250,
    unlockMethod: 'Purchase with BPC',
    unlockRequirement: 'Beli di Wizard Merchant',
    requiredLevel: 1,
    isActive: true,
  });

  const [isFree, setIsFree] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null);

  // Theme Forge Specific State
  const [themeIsDark, setThemeIsDark] = useState<boolean>(false);
  const [themeColors, setThemeColors] = useState<ThemeColorState>(STARTER_TEMPLATES[0].colors);
  // Outer Glow state
  const [glowEnabled, setGlowEnabled] = useState<boolean>(false);
  const [glowColor, setGlowColor] = useState<string>('#ec4899');
  const [glowOpacity, setGlowOpacity] = useState<number>(25);
  const [glowBlur, setGlowBlur] = useState<number>(16);
  const [glowSpread, setGlowSpread] = useState<number>(2);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name,
        description: itemToEdit.description,
        type: itemToEdit.type,
        rarity: itemToEdit.rarity,
        assetUrl: itemToEdit.assetUrl,
        previewAssetUrl: itemToEdit.previewAssetUrl,
        bpcPrice: itemToEdit.bpcPrice,
        unlockMethod: itemToEdit.unlockMethod,
        unlockRequirement: itemToEdit.unlockRequirement,
        requiredLevel: itemToEdit.requiredLevel,
        isActive: itemToEdit.isActive ?? true,
        themeDefinition: itemToEdit.themeDefinition,
      });
      setIsFree(itemToEdit.bpcPrice === 0);

      if (itemToEdit.type === 'Theme' && itemToEdit.themeDefinition) {
        setThemeIsDark(itemToEdit.themeDefinition.isDark);
        const tc = itemToEdit.themeDefinition.colors;
        setThemeColors({
          primary: tc.primary || '#f97316',
          primaryHover: tc.primaryHover || '#ea580c',
          primaryText: tc.primaryText || '#ffffff',
          secondary: tc.secondary || '#6366f1',
          secondaryHover: tc.secondaryHover || '#4f46e5',
          bg: tc.bg || '#f8fafc',
          surface: tc.surface || '#ffffff',
          surfaceAlt: tc.surfaceAlt || '#f1f5f9',
          textPrimary: tc.textPrimary || tc.text || '#0f172a',
          textSecondary: tc.textSecondary || '#334155',
          textMuted: tc.textMuted || '#475569',
          border: tc.border || '#cbd5e1',
          borderHighlight: tc.borderHighlight || '#94a3b8',
          accentGold: tc.accentGold || '#d97706',
          accentEmerald: tc.accentEmerald || '#059669',
          accentRose: tc.accentRose || '#e11d48',
          progressTrack: tc.progressTrack || '#e2e8f0',
        });

        const g = itemToEdit.themeDefinition.effects?.surfaceGlow;
        if (g) {
          setGlowEnabled(!!g.enabled);
          setGlowColor(g.color || '#ec4899');
          setGlowOpacity(g.opacity > 1 ? g.opacity : Math.round((g.opacity || 0.25) * 100));
          setGlowBlur(g.blur !== undefined ? g.blur : 16);
          setGlowSpread(g.spread !== undefined ? g.spread : 2);
        } else {
          setGlowEnabled(false);
          setGlowColor('#ec4899');
          setGlowOpacity(25);
          setGlowBlur(16);
          setGlowSpread(2);
        }
      }
    } else {
      setFormData({
        name: '',
        description: '',
        type: defaultCategory,
        rarity: 'Common',
        assetUrl: '',
        previewAssetUrl: '',
        bpcPrice: 250,
        unlockMethod: 'Purchase with BPC',
        unlockRequirement: 'Beli di Bounty Shop',
        requiredLevel: 1,
        isActive: true,
      });
      setIsFree(false);
      setThemeIsDark(false);
      setThemeColors(STARTER_TEMPLATES[0].colors);
      setGlowEnabled(false);
      setGlowColor('#ec4899');
      setGlowOpacity(25);
      setGlowBlur(16);
      setGlowSpread(2);
    }
    setErrorMsg(null);
    setDimensionWarning(null);
  }, [itemToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleColorChange = (key: keyof ThemeColorState, val: string) => {
    setThemeColors(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'primary') {
        next.primaryHover = val;
      } else if (key === 'secondary') {
        next.secondaryHover = val;
      }
      return next;
    });
  };

  const applyStarterTemplate = (tpl: (typeof STARTER_TEMPLATES)[0]) => {
    setThemeIsDark(tpl.isDark);
    setThemeColors(tpl.colors);
    if (tpl.glow) {
      setGlowEnabled(tpl.glow.enabled);
      setGlowColor(tpl.glow.color);
      setGlowOpacity(tpl.glow.opacity);
      setGlowBlur(tpl.glow.blur);
      setGlowSpread(tpl.glow.spread);
    }
  };

  // Validate and persist image file when user uploads (Data URL base64 for persistent storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas 5MB. Silakan kompres gambar.');
      return;
    }

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setErrorMsg('Gagal membaca file gambar.');
        return;
      }

      // If it's SVG, directly persist the vector Data URL so all paths stay crisp and transparent
      if (isSvg) {
        setFormData(prev => ({
          ...prev,
          assetUrl: dataUrl,
          previewAssetUrl: dataUrl,
        }));
        setDimensionWarning(null);
        setErrorMsg(null);
        return;
      }

      // For PNG / JPEG / WEBP: inspect image dimensions and optimize storage
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // Check dimension recommendations
        if (formData.type === 'BPC Coin') {
          if (width !== 512 || height !== 512) {
            setDimensionWarning(
              `Peringatan: Dimensi gambar ${width}×${height}px. Rekomendasi resmi BPC Token adalah 512×512px transparan.`
            );
          } else {
            setDimensionWarning(null);
          }
        } else if (formData.type === 'Profile Frame') {
          if (width !== 512 || height !== 512) {
            setDimensionWarning(
              `Peringatan: Dimensi gambar terdeteksi ${width}×${height}px. Rekomendasi resmi Avatar Frame adalah 512×512px.`
            );
          } else {
            setDimensionWarning(null);
          }
        } else if (formData.type === 'Achievement Badge') {
          if (width !== 256 || height !== 256) {
            setDimensionWarning(
              `Peringatan: Dimensi gambar terdeteksi ${width}×${height}px. Rekomendasi resmi Achievement Badge adalah 256×256px.`
            );
          } else {
            setDimensionWarning(null);
          }
        } else if (formData.type === 'Treasure Map') {
          const ratio = width / height;
          if (Math.abs(ratio - 16 / 9) > 0.1) {
            setDimensionWarning(
              `Peringatan: Rasio gambar bukan 16:9 (${width}×${height}px). Rekomendasi resmi Treasure Map adalah 1600×900px.`
            );
          } else {
            setDimensionWarning(null);
          }
        } else {
          setDimensionWarning(null);
        }

        // Optimize raster image to keep within localStorage budget while maintaining high clarity and PNG alpha transparency
        const maxDim = formData.type === 'Treasure Map' ? 1024 : 512;
        if (width > maxDim || height > maxDim) {
          const canvas = document.createElement('canvas');
          let targetW = width;
          let targetH = height;
          if (width > height) {
            targetW = maxDim;
            targetH = Math.round((height * maxDim) / width);
          } else {
            targetH = maxDim;
            targetW = Math.round((width * maxDim) / height);
          }
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);
            // Use image/png to strictly preserve transparent backgrounds for coins/frames/badges
            const optimizedDataUrl = canvas.toDataURL('image/png');
            setFormData(prev => ({
              ...prev,
              assetUrl: optimizedDataUrl,
              previewAssetUrl: optimizedDataUrl,
            }));
            setErrorMsg(null);
            return;
          }
        }

        // Otherwise use the clean Data URL
        setFormData(prev => ({
          ...prev,
          assetUrl: dataUrl,
          previewAssetUrl: dataUrl,
        }));
        setErrorMsg(null);
      };

      img.onerror = () => {
        setErrorMsg('Format gambar tidak valid atau file rusak.');
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca file dari sistem.');
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Nama item kosmetik wajib diisi.');
      return;
    }

    const finalPrice = isFree ? 0 : Number(formData.bpcPrice) || 0;
    const finalUnlockReq = isFree
      ? 'Gratis untuk semua Hunter'
      : formData.unlockRequirement || `Beli seharga ${finalPrice} BPC`;

    // Handle Theme type specially
    if (formData.type === 'Theme') {
      const themeId =
        itemToEdit?.themeDefinition?.id ||
        itemToEdit?.id?.replace(/^cosm_/, 'theme_') ||
        `theme_${Date.now()}`;

      const themeDefinition: ThemeDefinition = {
        id: themeId,
        name: formData.name.trim(),
        description: formData.description?.trim() || 'Custom theme palette',
        isDark: themeIsDark,
        colors: {
          bg: themeColors.bg,
          surface: themeColors.surface,
          surfaceAlt: themeColors.surfaceAlt,
          surfaceCard: themeColors.surface,
          border: themeColors.border,
          borderHighlight: themeColors.borderHighlight || themeColors.border,
          text: themeColors.textPrimary,
          textPrimary: themeColors.textPrimary,
          textSecondary: themeColors.textSecondary,
          textMuted: themeColors.textMuted,
          textDisabled: themeIsDark ? '#64748b' : '#94a3b8',
          textOnPrimary: themeColors.primaryText || '#ffffff',
          textOnDark: '#ffffff',
          textOnDarkSecondary: '#e2e8f0',
          textOnDarkMuted: '#cbd5e1',
          textOnCard: themeColors.textPrimary,
          primary: themeColors.primary,
          primaryHover: themeColors.primaryHover || themeColors.primary,
          primaryText: themeColors.primaryText || '#ffffff',
          secondary: themeColors.secondary,
          secondaryHover: themeColors.secondaryHover || themeColors.secondary,
          accentGold: themeColors.accentGold,
          accentEmerald: themeColors.accentEmerald,
          accentRose: themeColors.accentRose,
          progressTrack: themeColors.progressTrack,
          cardShadow: themeIsDark
            ? '0 6px 20px -4px rgba(0, 0, 0, 0.6)'
            : '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        },
        effects: {
          surfaceGlow: {
            enabled: glowEnabled,
            color: glowColor,
            opacity: Number(glowOpacity) / 100,
            blur: Number(glowBlur),
            spread: Number(glowSpread),
          },
        },
      };

      saveCustomTheme(themeDefinition);

      onSubmit(
        {
          ...formData,
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          assetUrl: themeId,
          previewAssetUrl: '',
          themeDefinition,
          bpcPrice: finalPrice,
          unlockRequirement: finalUnlockReq,
        },
        isEdit,
        itemToEdit?.id
      );
      onClose();
      return;
    }

    // Standard Non-Theme Cosmetics
    onSubmit(
      {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        bpcPrice: finalPrice,
        unlockRequirement: finalUnlockReq,
      },
      isEdit,
      itemToEdit?.id
    );
    onClose();
  };

  const isTheme = formData.type === 'Theme';

  return (
    <div
      id="forge-cosmetic-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="forge-cosmetic-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-3xl w-full max-h-[92vh] flex flex-col bg-surface border border-theme shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 text-xl font-bold">
              {isTheme ? '🎨' : '✨'}
            </div>
            <div>
              <h3 className="font-black text-base text-theme">
                {isEdit
                  ? isTheme
                    ? 'EDIT PALET TEMA (THEME FORGE)'
                    : 'EDIT COSMETIC ITEM'
                  : isTheme
                  ? 'FORGE NEW DASHBOARD THEME'
                  : 'FORGE NEW COSMETIC ITEM'}
              </h3>
              <p className="text-xs text-theme-muted">
                {isTheme
                  ? 'Konfigurasi warna palet desain dashboard. Tanpa perlu unggah file gambar.'
                  : 'Kustomisasi Avatar Frame, Badge, Gelar, Koin, atau Peta Harta Karun.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {dimensionWarning && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dimensionWarning}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Kategori Kosmetik *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as CosmeticType })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              >
                <option value="Theme">🎨 Dashboard Theme (Palet Warna Desain)</option>
                <option value="BPC Coin">🪙 BPC Coin / Token (512 × 512 px PNG / Emoji)</option>
                <option value="Profile Frame">🖼️ Avatar Frame (512 × 512 px PNG)</option>
                <option value="Achievement Badge">🏆 Achievement Badge (256 × 256 px PNG/SVG)</option>
                <option value="Profile Title">🏷️ Profile Title (Gelar Teks Khusus)</option>
                <option value="Treasure Map">🗺️ Treasure Map (1600 × 900 px 16:9 WebP)</option>
              </select>
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">
                {isTheme ? 'Nama Tema *' : 'Nama Kosmetik *'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  isTheme
                    ? 'cth. Crimson Flame Theme, Ocean Breeze'
                    : 'cth. Golden Captain Frame, Speed Closer'
                }
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-semibold text-theme outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Deskripsi Item</label>
              <textarea
                rows={2}
                placeholder={
                  isTheme
                    ? 'cth. Tema warna gelap modern dengan aksen api merah jingga menyala untuk meningkatkan fokus...'
                    : 'cth. Bingkai avatar melingkar bercahaya emas murni khas pemimpin armada...'
                }
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none resize-none"
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Rarity Item *</label>
              <select
                value={formData.rarity}
                onChange={e => setFormData({ ...formData, rarity: e.target.value as BountyRarity })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              >
                {COSMETIC_RARITY_LIST.map(rarityKey => {
                  const cfg = getRarityConfig(rarityKey);
                  return (
                    <option key={rarityKey} value={rarityKey}>
                      {cfg.label} ({rarityKey})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Required Level */}
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Syarat Minimal Level</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.requiredLevel || 1}
                onChange={e => setFormData({ ...formData, requiredLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-black text-theme outline-none font-mono"
              />
            </div>

            {/* ================================================================= */}
            {/* THEME FORGE: COLOR CONFIGURATOR & REAL-TIME PREVIEW */}
            {/* ================================================================= */}
            {isTheme ? (
              <div className="sm:col-span-2 space-y-4 pt-2">
                {/* Starter Templates */}
                <div className="p-4 rounded-xl bg-surface-alt border border-theme space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-theme flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-500" />
                      STARTER PALETTE TEMPLATES
                    </span>
                    <span className="text-[10px] text-theme-muted">
                      Pilih dasar warna cepat & sesuaikan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STARTER_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyStarterTemplate(tpl)}
                        className="p-2 rounded-xl bg-surface hover:bg-surface-alt border border-theme flex items-center justify-between text-left transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-theme group-hover:text-theme-primary">
                            {tpl.name}
                          </div>
                          <span className="text-[9px] text-theme-muted font-semibold">
                            {tpl.isDark ? '🌙 Dark' : '☀️ Light'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full border border-black/10"
                            style={{ backgroundColor: tpl.colors.primary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-black/10"
                            style={{ backgroundColor: tpl.colors.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-black/10"
                            style={{ backgroundColor: tpl.colors.bg }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Light / Dark Mode Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-alt border border-theme">
                  <div>
                    <span className="text-xs font-bold text-theme">Mode Tampilan Tema</span>
                    <p className="text-[11px] text-theme-muted">
                      Menentukan kontras dasar font dan elemen gelap/terang.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setThemeIsDark(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        !themeIsDark
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-surface text-theme-muted border border-theme'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeIsDark(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        themeIsDark
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-surface text-theme-muted border border-theme'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Color Token Grid */}
                <div className="p-4 rounded-xl bg-surface-alt border border-theme space-y-3">
                  <div className="flex items-center justify-between border-b border-theme pb-2">
                    <span className="text-xs font-black text-theme flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-pink-500" />
                      COLOR TOKENS CONFIGURATOR
                    </span>
                    <span className="text-[10px] text-theme-muted font-mono">
                      Real-time Hex & Color Pickers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Primary Color */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Primary Brand</span>
                        <span className="text-[9px] text-theme-muted font-normal">Tombol Utama & Tab</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.primary}
                          onChange={e => handleColorChange('primary', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.primary}
                          onChange={e => handleColorChange('primary', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Secondary Brand</span>
                        <span className="text-[9px] text-theme-muted font-normal">Aksen Sekunder</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.secondary}
                          onChange={e => handleColorChange('secondary', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.secondary}
                          onChange={e => handleColorChange('secondary', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Canvas Background */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Canvas Background</span>
                        <span className="text-[9px] text-theme-muted font-normal">Latar Halaman</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.bg}
                          onChange={e => handleColorChange('bg', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.bg}
                          onChange={e => handleColorChange('bg', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Surface Card Background */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Surface / Card</span>
                        <span className="text-[9px] text-theme-muted font-normal">Wadah Kartu Utama</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.surface}
                          onChange={e => handleColorChange('surface', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.surface}
                          onChange={e => handleColorChange('surface', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Surface Alt / Input Background */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Surface Alt</span>
                        <span className="text-[9px] text-theme-muted font-normal">Form Input & Badge</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.surfaceAlt}
                          onChange={e => handleColorChange('surfaceAlt', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.surfaceAlt}
                          onChange={e => handleColorChange('surfaceAlt', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Primary Text */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Primary Text</span>
                        <span className="text-[9px] text-theme-muted font-normal">Judul & Angka</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.textPrimary}
                          onChange={e => handleColorChange('textPrimary', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.textPrimary}
                          onChange={e => handleColorChange('textPrimary', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Secondary / Muted Text */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Muted Text</span>
                        <span className="text-[9px] text-theme-muted font-normal">Subteks & Metadata</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.textSecondary}
                          onChange={e => handleColorChange('textSecondary', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.textSecondary}
                          onChange={e => handleColorChange('textSecondary', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Border Color */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Border & Divider</span>
                        <span className="text-[9px] text-theme-muted font-normal">Garis Batas Kartu</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.border}
                          onChange={e => handleColorChange('border', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.border}
                          onChange={e => handleColorChange('border', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Accent Gold (Coin & Rewards) */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Accent Gold</span>
                        <span className="text-[9px] text-amber-500 font-bold">BPC Coin & Reward</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.accentGold}
                          onChange={e => handleColorChange('accentGold', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.accentGold}
                          onChange={e => handleColorChange('accentGold', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Accent Emerald (Success) */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Accent Emerald</span>
                        <span className="text-[9px] text-emerald-500 font-bold">Closing & Selesai</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.accentEmerald}
                          onChange={e => handleColorChange('accentEmerald', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.accentEmerald}
                          onChange={e => handleColorChange('accentEmerald', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>

                    {/* Accent Rose (Danger & Alert) */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme space-y-1.5">
                      <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                        <span>Accent Rose</span>
                        <span className="text-[9px] text-rose-500 font-bold">Bounty Boss & Batal</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeColors.accentRose}
                          onChange={e => handleColorChange('accentRose', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={themeColors.accentRose}
                          onChange={e => handleColorChange('accentRose', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Surface / Outer Glow Effect Configurator */}
                <div className="p-4 rounded-xl bg-surface-alt border border-theme space-y-3">
                  <div className="flex items-center justify-between border-b border-theme pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-theme">
                        SURFACE / OUTER GLOW EFFECT
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] font-bold text-theme">
                        {glowEnabled ? 'Glow Aktif' : 'Glow Nonaktif'}
                      </span>
                      <input
                        type="checkbox"
                        checked={glowEnabled}
                        onChange={e => setGlowEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer"
                      />
                    </label>
                  </div>

                  {glowEnabled && (
                    <div className="space-y-4 pt-1">
                      {/* Glow Color & Quick Chips */}
                      <div className="p-3 rounded-xl bg-surface border border-theme space-y-2.5">
                        <label className="text-[11px] font-bold text-theme flex items-center justify-between">
                          <span>Warna Glow (Aura Glow Color)</span>
                          <span className="text-[9px] text-theme-muted font-mono">{glowColor}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={glowColor}
                            onChange={e => setGlowColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-theme cursor-pointer shrink-0 p-0.5 bg-transparent"
                          />
                          <input
                            type="text"
                            value={glowColor}
                            onChange={e => setGlowColor(e.target.value)}
                            className="flex-1 px-2 py-1 rounded-lg bg-surface-alt border border-theme font-mono text-xs font-bold text-theme uppercase"
                          />
                        </div>

                        {/* Quick Color Match Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-theme-muted font-bold mr-1">
                            Saran Warna:
                          </span>
                          {[
                            { label: 'Primary', color: themeColors.primary },
                            { label: 'Secondary', color: themeColors.secondary },
                            { label: 'Sakura Pink', color: '#ec4899' },
                            { label: 'Cyber Cyan', color: '#06b6d4' },
                            { label: 'Gold', color: '#f59e0b' },
                            { label: 'Emerald', color: '#10b981' },
                          ].map(chip => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => setGlowColor(chip.color)}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                              style={{
                                backgroundColor: `${chip.color}15`,
                                borderColor: `${chip.color}40`,
                                color: chip.color,
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: chip.color }}
                              />
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders Grid: Opacity, Blur, Spread */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Opacity Slider */}
                        <div className="p-3 rounded-xl bg-surface border border-theme space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-theme">Opacity</span>
                            <span className="text-[11px] font-mono font-bold text-theme-primary">
                              {glowOpacity}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={glowOpacity}
                            onChange={e => setGlowOpacity(Number(e.target.value))}
                            className="w-full h-1.5 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-theme-primary"
                          />
                          <p className="text-[9px] text-theme-muted">Kepekatan pancaran aura</p>
                        </div>

                        {/* Blur Radius Slider */}
                        <div className="p-3 rounded-xl bg-surface border border-theme space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-theme">Blur Radius</span>
                            <span className="text-[11px] font-mono font-bold text-theme-primary">
                              {glowBlur}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="40"
                            value={glowBlur}
                            onChange={e => setGlowBlur(Number(e.target.value))}
                            className="w-full h-1.5 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-theme-primary"
                          />
                          <p className="text-[9px] text-theme-muted">Jarak kelembutan pendaran</p>
                        </div>

                        {/* Spread Radius Slider */}
                        <div className="p-3 rounded-xl bg-surface border border-theme space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-theme">Spread</span>
                            <span className="text-[11px] font-mono font-bold text-theme-primary">
                              {glowSpread}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={glowSpread}
                            onChange={e => setGlowSpread(Number(e.target.value))}
                            className="w-full h-1.5 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-theme-primary"
                          />
                          <p className="text-[9px] text-theme-muted">Ketebalan ekspansi glow</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LIVE DASHBOARD PREVIEW */}
                <div className="p-4 rounded-2xl bg-surface-alt border-2 border-theme-primary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-theme flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      LIVE DASHBOARD PREVIEW SIMULATOR
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Real-time Updating
                    </span>
                  </div>

                  {/* Simulated Container Box */}
                  <div
                    className="p-5 rounded-2xl border transition-colors space-y-4"
                    style={{
                      backgroundColor: themeColors.bg,
                      borderColor: themeColors.border,
                      color: themeColors.textPrimary,
                    }}
                  >
                    {/* Simulated Header Bar */}
                    <div
                      className="p-3.5 rounded-xl border flex items-center justify-between shadow-sm transition-shadow"
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        ...(glowEnabled
                          ? {
                              boxShadow: `0 0 ${glowBlur}px ${glowSpread}px ${glowColor}${Math.round(
                                (glowOpacity / 100) * 255
                              )
                                .toString(16)
                                .padStart(2, '0')}`,
                            }
                          : {}),
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                          style={{
                            backgroundColor: themeColors.primary,
                            color: themeColors.primaryText,
                          }}
                        >
                          ⚡
                        </div>
                        <div>
                          <div
                            className="font-black text-xs"
                            style={{ color: themeColors.textPrimary }}
                          >
                            {formData.name || 'Pratinjau Tema Baru'}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: themeColors.textSecondary }}
                          >
                            BPC Bounty Hunt Operational Dashboard
                          </div>
                        </div>
                      </div>

                      {/* BPC Coin Balance Widget */}
                      <div
                        className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono text-xs font-bold"
                        style={{
                          backgroundColor: themeColors.surfaceAlt,
                          borderColor: themeColors.border,
                          color: themeColors.accentGold,
                        }}
                      >
                        <BpcCoinIcon size="xs" />
                        <span>2,450 BPC</span>
                      </div>
                    </div>

                    {/* Simulated Main Dashboard Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Card 1: Sample Bounty Progress Card */}
                      <div
                        className="p-4 rounded-xl border shadow-sm space-y-2.5 transition-shadow"
                        style={{
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          ...(glowEnabled
                            ? {
                                boxShadow: `0 0 ${glowBlur}px ${glowSpread}px ${glowColor}${Math.round(
                                  (glowOpacity / 100) * 255
                                )
                                  .toString(16)
                                  .padStart(2, '0')}`,
                              }
                            : {}),
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${themeColors.accentEmerald}20`,
                              color: themeColors.accentEmerald,
                              border: `1px solid ${themeColors.accentEmerald}40`,
                            }}
                          >
                            DAILY BOUNTY • ACTIVE
                          </span>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: themeColors.accentGold }}
                          >
                            +150 XP • +25 BPC
                          </span>
                        </div>

                        <div>
                          <div
                            className="font-black text-xs"
                            style={{ color: themeColors.textPrimary }}
                          >
                            Lead Closer of the Day
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: themeColors.textSecondary }}
                          >
                            Closing minimal 5 order pelanggan hari ini.
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span style={{ color: themeColors.textSecondary }}>Progress Target</span>
                            <span style={{ color: themeColors.accentEmerald }}>4 / 5 Order (80%)</span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: themeColors.progressTrack }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: '80%',
                                backgroundColor: themeColors.accentEmerald,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Interactive Controls & Typography */}
                      <div
                        className="p-4 rounded-xl border shadow-sm space-y-3 transition-shadow"
                        style={{
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          ...(glowEnabled
                            ? {
                                boxShadow: `0 0 ${glowBlur}px ${glowSpread}px ${glowColor}${Math.round(
                                  (glowOpacity / 100) * 255
                                )
                                  .toString(16)
                                  .padStart(2, '0')}`,
                              }
                            : {}),
                        }}
                      >
                        <div>
                          <div
                            className="font-black text-xs"
                            style={{ color: themeColors.textPrimary }}
                          >
                            Aksi Cepat & Komponen UI
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: themeColors.textSecondary }}
                          >
                            Simulasi tombol aksi, badge status, dan teks kontras.
                          </div>
                        </div>

                        {/* Simulated Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                            style={{
                              backgroundColor: themeColors.primary,
                              color: themeColors.primaryText,
                            }}
                          >
                            Ambil Bounty
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer"
                            style={{
                              backgroundColor: themeColors.secondary,
                              color: '#ffffff',
                            }}
                          >
                            Hunt Log
                          </button>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${themeColors.accentEmerald}15`,
                              color: themeColors.accentEmerald,
                              border: `1px solid ${themeColors.accentEmerald}30`,
                            }}
                          >
                            Order Selesai
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${themeColors.accentGold}15`,
                              color: themeColors.accentGold,
                              border: `1px solid ${themeColors.accentGold}30`,
                            }}
                          >
                            Follow-up
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${themeColors.accentRose}15`,
                              color: themeColors.accentRose,
                              border: `1px solid ${themeColors.accentRose}30`,
                            }}
                          >
                            Batal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================================================================= */
              /* NON-THEME COSMETICS: PREVIEW & ASSET UPLOAD */
              /* ================================================================= */
              <>
                {/* LIVE PREVIEW CARD */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-surface-alt border-2 border-theme-primary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-theme flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      LIVE PREVIEW VISUAL
                    </span>
                    <span className="text-[11px] font-bold text-theme-muted">
                      Tampilan Real-time Saat Digunakan
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 px-3 rounded-lg bg-surface border border-theme min-h-[90px]">
                    {formData.type === 'Profile Title' && (
                      <div className="flex flex-col items-center gap-2">
                        <ProfileTitleBadge
                          titleText={formData.name?.trim() || 'Contoh Gelar Hunter'}
                          rarity={formData.rarity}
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted font-medium">
                          Rarity: <strong className="text-theme">{getRarityConfig(formData.rarity).label}</strong>
                        </span>
                      </div>
                    )}

                    {formData.type === 'BPC Coin' && (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-surface-alt border border-theme flex items-center justify-center shadow-inner overflow-hidden p-1">
                          {(formData.previewAssetUrl || formData.assetUrl) &&
                          ((formData.previewAssetUrl || formData.assetUrl).startsWith('http') ||
                            (formData.previewAssetUrl || formData.assetUrl).startsWith('data:') ||
                            (formData.previewAssetUrl || formData.assetUrl).startsWith('blob:') ||
                            (formData.previewAssetUrl || formData.assetUrl).startsWith('/')) ? (
                            <img
                              src={formData.previewAssetUrl || formData.assetUrl}
                              alt={formData.name || 'BPC Coin'}
                              className="w-10 h-10 object-contain rounded-full"
                              onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : formData.assetUrl && formData.assetUrl.trim().length <= 4 ? (
                            <span className="text-3xl">{formData.assetUrl}</span>
                          ) : (
                            <BpcCoinIcon coinId={itemToEdit?.id} size="xl" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-theme">
                            {formData.name || 'Custom BPC Coin'}
                          </div>
                          <div className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                            {(formData.previewAssetUrl || formData.assetUrl) &&
                            ((formData.previewAssetUrl || formData.assetUrl).startsWith('http') ||
                              (formData.previewAssetUrl || formData.assetUrl).startsWith('data:') ||
                              (formData.previewAssetUrl || formData.assetUrl).startsWith('blob:') ||
                              (formData.previewAssetUrl || formData.assetUrl).startsWith('/')) ? (
                              <img
                                src={formData.previewAssetUrl || formData.assetUrl}
                                alt=""
                                className="w-3.5 h-3.5 object-contain rounded-full inline-block"
                              />
                            ) : formData.assetUrl && formData.assetUrl.trim().length <= 4 ? (
                              <span className="text-xs">{formData.assetUrl}</span>
                            ) : (
                              <BpcCoinIcon coinId={itemToEdit?.id} size="xs" />
                            )}
                            <span>1,250 BPC Saldo</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'Profile Frame' && (
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-theme overflow-hidden border">
                          <span>👤</span>
                          {formData.previewAssetUrl && (
                            <img
                              src={formData.previewAssetUrl}
                              alt={formData.name}
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-theme">
                            {formData.name || 'Avatar Frame'}
                          </div>
                          <div className="text-[10px] text-theme-muted">Tampilan bingkai foto hunter</div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'Achievement Badge' && (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-theme flex items-center justify-center shadow-md overflow-hidden">
                          {formData.previewAssetUrl ? (
                            <img
                              src={formData.previewAssetUrl}
                              alt={formData.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🏆</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-theme">
                            {formData.name || 'Badge Medali'}
                          </div>
                          <div className="text-[10px] text-theme-muted">Lencana pencapaian profil</div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'Treasure Map' && (
                      <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
                        <div className="w-full h-24 rounded-lg bg-surface-alt border border-theme overflow-hidden flex items-center justify-center relative">
                          {formData.previewAssetUrl ? (
                            <img
                              src={formData.previewAssetUrl}
                              alt={formData.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-theme-muted font-bold">
                              🗺️ Map Background Preview
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-theme">
                          {formData.name || 'Peta Petualangan'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Asset Upload & URL for Non-Theme */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-theme">
                    Asset Visual (URL / Upload File)
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={
                        formData.type === 'Profile Title'
                          ? 'cth. Master Closer BPC'
                          : formData.type === 'BPC Coin'
                          ? 'cth. 🪙 atau URL Gambar'
                          : 'cth. https://.../frame.png atau upload file'
                      }
                      value={formData.assetUrl || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          assetUrl: e.target.value,
                          previewAssetUrl: e.target.value,
                        })
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-mono text-theme outline-none"
                    />

                    <label className="px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-alt border border-theme text-theme text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4 text-purple-500" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Asset guidelines hint */}
                  <div className="text-[11px] text-theme-muted bg-surface-alt p-2.5 rounded-xl border border-theme">
                    {formData.type === 'Profile Frame' && (
                      <span>
                        📐 <strong>Avatar Frame:</strong> Rekomendasi 512×512 px (PNG Transparan). Bagian tengah transparan untuk foto hunter.
                      </span>
                    )}
                    {formData.type === 'Achievement Badge' && (
                      <span>
                        📐 <strong>Achievement Badge:</strong> Rekomendasi 256×256 px (PNG/SVG) persegi tajam berdaya kontras tinggi.
                      </span>
                    )}
                    {formData.type === 'Treasure Map' && (
                      <span>
                        📐 <strong>Treasure Map:</strong> Rasio 16:9 (Rekomendasi 1600×900 px WebP/PNG).
                      </span>
                    )}
                    {formData.type === 'BPC Coin' && (
                      <span>
                        📐 <strong>BPC Token:</strong> Rekomendasi 512×512 px (PNG Transparan) atau simbol emoji visual.
                      </span>
                    )}
                    {formData.type === 'Profile Title' && (
                      <span>
                        🏷️ <strong>Profile Title:</strong> Teks badge gelar yang akan tampil di header profil dan peringkat leaderboard.
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Pricing Section */}
            <div className="sm:col-span-2 p-4 rounded-xl bg-surface-alt border border-theme space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-theme">Harga Pembelian Item</span>
                  <p className="text-[11px] text-theme-muted">
                    Atur apakah item ini dapat dibuka gratis atau dibeli menggunakan Bounty Pearl Coin (BPC).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFree(true);
                      setFormData({ ...formData, bpcPrice: 0 });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFree
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-surface text-theme-muted border border-theme'
                    }`}
                  >
                    FREE (Gratis)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFree(false);
                      if (!formData.bpcPrice || formData.bpcPrice === 0) {
                        setFormData({ ...formData, bpcPrice: 250 });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isFree
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-surface text-theme-muted border border-theme'
                    }`}
                  >
                    PAID (BPC)
                  </button>
                </div>
              </div>

              {!isFree && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-36">
                    <label className="block text-[11px] font-bold text-amber-500 mb-1">
                      Harga (BPC Coin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.bpcPrice || 0}
                      onChange={e => setFormData({ ...formData, bpcPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-black text-amber-500 outline-none font-mono"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-theme mb-1">
                      Keterangan Syarat Buka
                    </label>
                    <input
                      type="text"
                      placeholder={`Beli seharga ${formData.bpcPrice || 0} BPC`}
                      value={formData.unlockRequirement || ''}
                      onChange={e => setFormData({ ...formData, unlockRequirement: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active status */}
          <div className="pt-3 border-t border-theme flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-theme">Status Item di Toko</span>
              <p className="text-[11px] text-theme-muted">
                Item yang aktif akan langsung muncul di katalog Wizard Merchant untuk semua Hunter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.isActive
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-surface-alt text-theme-muted border border-theme'
              }`}
            >
              {formData.isActive ? '✓ Aktif di Wizard Merchant' : 'Non-aktif'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-theme flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt hover:bg-surface border border-theme cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-theme-primary text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEdit ? 'Simpan Perubahan' : isTheme ? 'Forge Tema Baru' : 'Forge Item Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
