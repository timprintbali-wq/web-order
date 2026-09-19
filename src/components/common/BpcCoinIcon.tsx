import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CosmeticItem } from '../../types';

export interface BpcCoinIconProps {
  coinId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  id?: string;
  title?: string;
}

export interface ResolvedBpcAsset {
  type: 'special' | 'image' | 'emoji' | 'default';
  coinId: string;
  name: string;
  symbol?: string;
  imageSrc?: string;
  glowClass?: string;
}

// Daftar ID koin bawaan sistem (preset). HANYA dicocokkan lewat ID, bukan nama,
// supaya item kosmetik buatan user bebas dinamai apa saja tanpa risiko tabrakan.
const PRESET_COINS: Record<string, { symbol: string; glowClass: string; defaultName: string }> = {
  coin_pearl: {
    symbol: '🔮',
    glowClass: 'drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]',
    defaultName: 'Radiant Pearl BPC',
  },
  coin_crimson: {
    symbol: '🔴',
    glowClass: 'drop-shadow-[0_0_6px_rgba(225,29,72,0.7)]',
    defaultName: 'Crimson Ruby BPC',
  },
  coin_divine: {
    symbol: '☀️',
    glowClass: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    defaultName: 'Divine Solar BPC',
  },
  coin_void: {
    symbol: '🌌',
    glowClass: 'drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]',
    defaultName: 'Transcended Void BPC',
  },
};

/**
 * Authoritative resolver for active BPC Coin visual asset.
 * Resolves:
 * 1. Explicit coinId OR currentUser.equippedCoin OR default 'coin_gold'
 * 2. Associated CosmeticItem from cosmetics catalog
 * 3. Stable persistent asset source (data URL, valid HTTP/HTTPS URL, emoji, or preset symbol)
 */
export function resolveBpcAsset(
  targetCoinId: string | undefined,
  equippedCoinId: string | undefined,
  cosmetics: CosmeticItem[]
): ResolvedBpcAsset {
  const activeId = targetCoinId || equippedCoinId || 'coin_gold';

  // Find corresponding cosmetic item
  const cosmetic =
    cosmetics.find(c => (c.id === activeId || c.assetUrl === activeId) && c.type === 'BPC Coin') ||
    cosmetics.find(c => c.id === activeId);

  // 1. Preset / Special Named Coins — dicocokkan HANYA lewat ID, bukan nama.
  // Ini mencegah item custom yang kebetulan namanya mirip ikut "dibajak" jadi preset.
  const presetKey = cosmetic?.id && PRESET_COINS[cosmetic.id] ? cosmetic.id : PRESET_COINS[activeId] ? activeId : null;
  if (presetKey) {
    const preset = PRESET_COINS[presetKey];
    return {
      type: 'special',
      coinId: presetKey,
      name: cosmetic?.name || preset.defaultName,
      symbol: preset.symbol,
      glowClass: preset.glowClass,
    };
  }

  // 2. Custom forged or uploaded image asset
  const assetSource = cosmetic?.assetUrl || (activeId !== 'coin_gold' ? activeId : '');
  if (assetSource && assetSource.trim() !== '') {
    if (
      assetSource.startsWith('data:image/') ||
      assetSource.startsWith('http://') ||
      assetSource.startsWith('https://') ||
      assetSource.startsWith('/') ||
      assetSource.startsWith('blob:')
    ) {
      return {
        type: 'image',
        coinId: cosmetic?.id || activeId,
        name: cosmetic?.name || 'Custom BPC Coin',
        imageSrc: assetSource,
      };
    }

    // Emoji or symbol string (e.g. 🪙, 💎, 🌟, 🪙)
    return {
      type: 'emoji',
      coinId: cosmetic?.id || activeId,
      name: cosmetic?.name || 'Custom BPC Token',
      symbol: assetSource,
    };
  }

  // 3. Default fallback: Classic Gold BPC
  return {
    type: 'default',
    coinId: 'coin_gold',
    name: 'Classic Gold BPC',
    symbol: '🪙',
    glowClass: 'drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]',
  };
}

export const BpcCoinIcon: React.FC<BpcCoinIconProps> = ({
  coinId,
  size = 'md',
  className = '',
  animated = false,
  id,
  title,
}) => {
  const { currentUser } = useAuth();
  const { cosmetics } = useData();
  const [imageError, setImageError] = useState(false);

  const resolved = resolveBpcAsset(coinId, currentUser?.equippedCoin, cosmetics);

  // Reset error state if image source changes
  useEffect(() => {
    setImageError(false);
  }, [resolved.imageSrc]);

  const sizeMap = {
    xs: 'text-[12px] w-4 h-4',
    sm: 'text-[14px] w-5 h-5',
    md: 'text-[16px] w-6 h-6',
    lg: 'text-[22px] w-8 h-8',
    xl: 'text-[32px] w-12 h-12',
  };

  const animClass = animated ? 'animate-coin' : '';
  const itemTitle = title || resolved.name;

  // 1. Render Special Preset Coins (Radiant Pearl, Crimson Ruby, Divine Solar, Transcended Void)
  if (resolved.type === 'special') {
    return (
      <span
        id={id}
        className={`inline-flex items-center justify-center select-none shrink-0 leading-none ${sizeMap[size]} ${animClass} ${className}`}
        title={itemTitle}
        role="img"
        aria-label={resolved.name}
      >
        <span className={`filter ${resolved.glowClass}`}>{resolved.symbol}</span>
      </span>
    );
  }

  // 2. Render Custom Image Asset (PNG / SVG / Data URL)
  if (resolved.type === 'image' && resolved.imageSrc && !imageError) {
    return (
      <img
        id={id}
        src={resolved.imageSrc}
        alt={resolved.name}
        className={`inline-block object-contain rounded-full select-none shrink-0 ${sizeMap[size]} ${animClass} ${className}`}
        referrerPolicy="no-referrer"
        title={itemTitle}
        onError={() => {
          console.warn(
            `[BpcCoinIcon] Failed to render image for coin '${resolved.coinId}'. Falling back to Classic Gold BPC.`,
            resolved.imageSrc?.substring(0, 100)
          );
          setImageError(true);
        }}
      />
    );
  }

  // 3. Render Custom Emoji / Symbol
  if (resolved.type === 'emoji' && resolved.symbol) {
    return (
      <span
        id={id}
        className={`inline-flex items-center justify-center select-none shrink-0 leading-none ${sizeMap[size]} ${animClass} ${className}`}
        title={itemTitle}
      >
        {resolved.symbol}
      </span>
    );
  }

  // 4. Default Classic Gold BPC (Used for default or safe fallback on invalid/broken assets)
  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center select-none shrink-0 leading-none ${sizeMap[size]} ${animClass} ${className}`}
      title={itemTitle}
      role="img"
      aria-label="Classic Gold BPC"
    >
      <span className="filter drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]">🪙</span>
    </span>
  );
};