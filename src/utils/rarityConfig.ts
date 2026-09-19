import { CosmeticRarity, BountyRarity } from '../types';

export interface RarityDefinition {
  rarity: CosmeticRarity | 'Boss';
  order: number;
  label: string;
  description: string;
  color: string;
  textColor: string;
  bgLight: string;
  bgSolid: string;
  borderColor: string;
  badgeClass: string;
  cardBorderClass: string;
  cardGlowClass: string;
  hasSparkles?: boolean;
  hasLightning?: boolean;
  gradientText?: string;
  previewBg: string;
}

export const RARITY_HIERARCHY: Record<CosmeticRarity | 'Boss', RarityDefinition> = {
  Common: {
    rarity: 'Common',
    order: 1,
    label: 'Common',
    description: 'Item standar untuk semua Hunter pemula',
    color: '#64748b',
    textColor: 'text-slate-700 dark:text-slate-300',
    bgLight: 'bg-slate-100 dark:bg-slate-800/80',
    bgSolid: 'bg-slate-600',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-semibold',
    cardBorderClass: 'border-slate-200 dark:border-slate-800 hover:border-slate-400',
    cardGlowClass: 'shadow-sm',
    previewBg: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
  },
  Rare: {
    rarity: 'Rare',
    order: 2,
    label: 'Rare',
    description: 'Item bernilai dengan aksen kristal cyan berharga',
    color: '#0284c7',
    textColor: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    bgSolid: 'bg-sky-500',
    borderColor: 'border-sky-300 dark:border-sky-700',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-bold',
    cardBorderClass: 'border-sky-300/80 dark:border-sky-800/80 hover:border-sky-400',
    cardGlowClass: 'shadow-sm hover:shadow-sky-500/10',
    previewBg: 'bg-gradient-to-br from-sky-50/50 to-blue-100/50 dark:from-sky-950/40 dark:to-blue-900/30',
  },
  Epic: {
    rarity: 'Epic',
    order: 3,
    label: 'Epic',
    description: 'Item langka ungu magis berkekuatan tinggi',
    color: '#9333ea',
    textColor: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    bgSolid: 'bg-purple-600',
    borderColor: 'border-purple-300 dark:border-purple-700',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-bold',
    cardBorderClass: 'border-purple-300/80 dark:border-purple-800/80 hover:border-purple-400',
    cardGlowClass: 'shadow-md shadow-purple-500/10 hover:shadow-purple-500/20',
    previewBg: 'bg-gradient-to-br from-purple-50/60 to-indigo-100/50 dark:from-purple-950/40 dark:to-indigo-950/30',
  },
  Legendary: {
    rarity: 'Legendary',
    order: 4,
    label: 'Legendary',
    description: 'Item legendaris berkilau emas murni kejayaan',
    color: '#eab308',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    bgSolid: 'bg-amber-500',
    borderColor: 'border-amber-400 dark:border-amber-600',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 font-extrabold',
    cardBorderClass: 'border-amber-400/90 dark:border-amber-500/80 hover:border-amber-400',
    cardGlowClass: 'shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25',
    previewBg: 'bg-gradient-to-br from-amber-50/70 to-yellow-100/60 dark:from-amber-950/40 dark:to-yellow-950/30',
  },
  Mythical: {
    rarity: 'Mythical',
    order: 5,
    label: 'Mythical',
    description: 'Item mistis darah pertempuran merah pekat nan agung',
    color: '#dc2626',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/50',
    bgSolid: 'bg-rose-600',
    borderColor: 'border-rose-400 dark:border-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-400 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600 font-extrabold tracking-wide',
    cardBorderClass: 'border-rose-400 dark:border-rose-600 hover:border-rose-500',
    cardGlowClass: 'shadow-lg shadow-rose-600/20 hover:shadow-rose-600/35',
    previewBg: 'bg-gradient-to-br from-rose-100/70 to-red-100/60 dark:from-rose-950/60 dark:to-red-950/40',
  },
  Divine: {
    rarity: 'Divine',
    order: 6,
    label: 'Divine',
    description: 'Item surgawi berkilau cahaya oranye emas berkerlip ✨',
    color: '#ea580c',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50 dark:bg-orange-950/60',
    bgSolid: 'bg-orange-500',
    borderColor: 'border-orange-400 dark:border-amber-500',
    badgeClass: 'bg-gradient-to-r from-orange-100 via-amber-100 to-orange-100 text-orange-900 border-orange-400 dark:from-orange-950/80 dark:via-amber-950/80 dark:to-orange-950/80 dark:text-amber-200 dark:border-orange-500 font-black animate-divine-glow',
    cardBorderClass: 'border-orange-400 dark:border-orange-500 animate-divine-glow',
    cardGlowClass: 'shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40',
    hasSparkles: true,
    previewBg: 'bg-gradient-to-br from-orange-100/80 via-amber-50 to-orange-100/80 dark:from-orange-950/70 dark:via-amber-950/40 dark:to-orange-950/70',
  },
  Transcended: {
    rarity: 'Transcended',
    order: 7,
    label: 'Transcended',
    description: 'Puncak kekuatan mutlak hitam abadi dengan sambaran petir putih kilat',
    color: '#0f172a',
    textColor: 'text-slate-900 dark:text-white',
    bgLight: 'bg-slate-900 text-white',
    bgSolid: 'bg-black text-white',
    borderColor: 'border-slate-800 dark:border-slate-300',
    badgeClass: 'bg-slate-950 text-white border-slate-700 dark:bg-black dark:text-white dark:border-slate-200 font-black animate-transcended-glow tracking-widest uppercase',
    cardBorderClass: 'border-slate-900 dark:border-white animate-transcended-glow',
    cardGlowClass: 'shadow-2xl shadow-slate-950/40 dark:shadow-white/20',
    hasLightning: true,
    previewBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white',
  },
  Boss: {
    rarity: 'Boss',
    order: 8,
    label: 'Boss Monster',
    description: 'Tantangan Bos Omset level tertinggi',
    color: '#b91c1c',
    textColor: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-50 dark:bg-red-950/60',
    bgSolid: 'bg-red-700',
    borderColor: 'border-red-500 dark:border-red-600',
    badgeClass: 'bg-red-100 text-red-900 border-red-500 dark:bg-red-950 dark:text-red-200 dark:border-red-600 font-black tracking-wide',
    cardBorderClass: 'border-red-500 dark:border-red-600 hover:border-red-400',
    cardGlowClass: 'shadow-xl shadow-red-600/30',
    previewBg: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-950 dark:to-rose-950',
  },
};

export const COSMETIC_RARITY_LIST: CosmeticRarity[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Mythical',
  'Divine',
  'Transcended',
];

export const ALL_RARITY_LIST: (CosmeticRarity | 'Boss')[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Mythical',
  'Divine',
  'Transcended',
  'Boss',
];

export function getRarityConfig(rarity: CosmeticRarity | BountyRarity | string | undefined): RarityDefinition {
  if (!rarity) return RARITY_HIERARCHY.Common;
  const match = RARITY_HIERARCHY[rarity as CosmeticRarity | 'Boss'];
  if (match) return match;
  return RARITY_HIERARCHY.Common;
}

export function compareRarities(a: string, b: string): number {
  const cfgA = getRarityConfig(a);
  const cfgB = getRarityConfig(b);
  return cfgA.order - cfgB.order;
}
