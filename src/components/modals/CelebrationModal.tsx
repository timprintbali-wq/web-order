import React from 'react';
import { Sparkles, Award, Crown, Flame, X, ArrowRight } from 'lucide-react';
import { CelebrationEvent } from '../../context/DataContext';

interface CelebrationModalProps {
  celebration: CelebrationEvent | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ celebration, onClose }) => {
  if (!celebration) return null;

  return (
    <div
      id="celebration-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="celebration-card"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-md w-full p-6 text-center relative overflow-hidden border-2 border-amber-400 shadow-2xl bg-surface animate-in zoom-in-95 duration-300"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Banner */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 text-white">
          {celebration.type === 'LEVEL_UP' ? (
            <Crown className="w-9 h-9" />
          ) : celebration.type === 'BOUNTY_COMPLETE' ? (
            <Award className="w-9 h-9" />
          ) : (
            <Flame className="w-9 h-9 text-rose-200" />
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-theme tracking-tight">
          {celebration.title}
        </h3>
        <p className="text-sm text-theme-muted mt-1 font-medium">{celebration.subtitle}</p>

        {/* Rewards pill */}
        {(celebration.xpGain || celebration.bpcGain) && (
          <div className="flex items-center justify-center gap-3 my-5 p-3 rounded-xl bg-surface-alt border border-theme">
            {celebration.xpGain && (
              <div className="flex items-center gap-1.5 font-black text-sky-500 text-base">
                <Sparkles className="w-4 h-4" />
                <span>+{celebration.xpGain} XP</span>
              </div>
            )}
            {celebration.bpcGain && (
              <div className="flex items-center gap-1.5 font-black text-amber-500 text-base">
                <span>🪙</span>
                <span>+{celebration.bpcGain} BPC</span>
              </div>
            )}
          </div>
        )}

        {/* Unlock info for level up */}
        {celebration.levelInfo && (
          <div className="mb-5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-left">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-sky-600 dark:text-sky-400">
              🎁 NEW UNLOCK!
            </div>
            <div className="text-sm font-bold text-theme mt-0.5">
              {celebration.levelInfo.unlockName}
            </div>
            <p className="text-xs text-theme-muted mt-0.5">
              {celebration.levelInfo.unlockDescription}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Lanjutkan Berburu!</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
