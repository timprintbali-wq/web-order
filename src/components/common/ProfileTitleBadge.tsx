import React from 'react';
import { getRarityConfig } from '../../utils/rarityConfig';
import { CosmeticRarity } from '../../types';

interface ProfileTitleBadgeProps {
  titleText: string;
  rarity?: CosmeticRarity | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const ProfileTitleBadge: React.FC<ProfileTitleBadgeProps> = ({
  titleText,
  rarity = 'Common',
  size = 'sm',
  className = '',
  id,
}) => {
  const config = getRarityConfig(rarity);

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 border',
    sm: 'text-xs px-2.5 py-0.5 border',
    md: 'text-sm px-3.5 py-1 border',
    lg: 'text-base px-4 py-1.5 border-2',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all select-none ${sizeClasses[size]} ${config.badgeClass} ${className}`}
      title={`Gelar ${titleText} (${config.label})`}
    >
      {config.hasSparkles && <span className="animate-pulse text-amber-500 select-none">✨</span>}
      {config.hasLightning && <span className="text-cyan-300 dark:text-cyan-200 select-none">⚡</span>}
      <span className="truncate max-w-[200px]">{titleText}</span>
      {config.hasSparkles && <span className="animate-pulse text-amber-500 select-none">✨</span>}
      {config.hasLightning && <span className="text-cyan-300 dark:text-cyan-200 select-none">⚡</span>}
    </span>
  );
};
