import React, { useState, useEffect } from 'react';
import { X, Crown, Sparkles, AlertCircle } from 'lucide-react';
import { LevelTier } from '../../types';

interface EditLevelModalProps {
  levelTier: LevelTier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: LevelTier, isNew?: boolean) => void;
  isNew?: boolean;
}

export const EditLevelModal: React.FC<EditLevelModalProps> = ({
  levelTier,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}) => {
  const [formData, setFormData] = useState<LevelTier>({
    level: 1,
    title: '',
    minXp: 0,
    maxXp: 999,
    unlockName: '',
    unlockDescription: '',
    bpcReward: 50,
    icon: 'Shield',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (levelTier) {
      setFormData({ ...levelTier });
    } else {
      setFormData({
        level: 9,
        title: 'New Hunter Rank',
        minXp: 100000,
        maxXp: 199999,
        unlockName: 'Special Hunter Frame',
        unlockDescription: 'Hadiah pencapaian level baru',
        bpcReward: 1000,
        icon: 'Crown',
      });
    }
    setErrorMsg(null);
  }, [levelTier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setErrorMsg('Nama Gelar Level wajib diisi.');
      return;
    }
    if (formData.minXp < 0 || formData.maxXp <= formData.minXp) {
      setErrorMsg('Max XP harus lebih besar dari Min XP.');
      return;
    }

    onSave(formData, isNew);
    onClose();
  };

  return (
    <div
      id="edit-level-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="edit-level-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-lg w-full bg-surface border border-theme shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xl font-bold">
              👑
            </div>
            <div>
              <h3 className="font-black text-base text-theme">
                {isNew ? 'TAMBAH LEVEL TIER BARU' : `KONFIGURASI LEVEL ${formData.level}`}
              </h3>
              <p className="text-xs text-theme-muted">
                Atur syarat XP, gelar, reward BPC, dan item yang terbuka.
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

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Nomor Level</label>
              <input
                type="number"
                min={1}
                max={99}
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-black text-theme outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Gelar Hunter (Title)</label>
              <input
                type="text"
                required
                placeholder="cth. Lead Explorer"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-500 mb-1">Min XP</label>
              <input
                type="number"
                min={0}
                value={formData.minXp}
                onChange={e => setFormData({ ...formData, minXp: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-sky-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-500 mb-1">Max XP</label>
              <input
                type="number"
                min={1}
                value={formData.maxXp}
                onChange={e => setFormData({ ...formData, maxXp: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-sky-500 outline-none font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Nama Unlock Hadiah</label>
              <input
                type="text"
                placeholder="cth. Weekly Bounty & Compass Badge"
                value={formData.unlockName}
                onChange={e => setFormData({ ...formData, unlockName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-semibold text-theme outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Deskripsi Unlock</label>
              <input
                type="text"
                placeholder="cth. Buka tantangan mingguan dan hadiah lebih besar"
                value={formData.unlockDescription}
                onChange={e => setFormData({ ...formData, unlockDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-amber-500 mb-1">Bonus Reward BPC Koin</label>
              <input
                type="number"
                min={0}
                value={formData.bpcReward}
                onChange={e => setFormData({ ...formData, bpcReward: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-black text-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-theme flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt border border-theme cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-theme-primary text-white text-xs font-black shadow-sm cursor-pointer hover:opacity-90"
            >
              Simpan Level
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
