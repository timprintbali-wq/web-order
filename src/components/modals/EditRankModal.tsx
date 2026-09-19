import React, { useState, useEffect } from 'react';
import { X, Shield, Gem, AlertCircle } from 'lucide-react';
import { RankTier } from '../../types';

interface EditRankModalProps {
  rankTier: RankTier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: RankTier) => void;
}

export const EditRankModal: React.FC<EditRankModalProps> = ({
  rankTier,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<RankTier>({
    id: 'bronze',
    name: 'Bronze Hunter',
    minMonthlyOmset: 15000000,
    minConversionRate: 15.0,
    badgeColor: '#cd7f32',
    icon: 'Shield',
    perks: 'Hunter pemula siap berburu',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (rankTier) {
      setFormData({ ...rankTier });
    }
    setErrorMsg(null);
  }, [rankTier, isOpen]);

  if (!isOpen || !rankTier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Nama Rank Tier wajib diisi.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div
      id="edit-rank-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="edit-rank-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-lg w-full bg-surface border border-theme shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl font-bold">
              🎖️
            </div>
            <div>
              <h3 className="font-black text-base text-theme">
                KONFIGURASI RANK {rankTier.name.toUpperCase()}
              </h3>
              <p className="text-xs text-theme-muted">
                Atur syarat omset bulanan, conversion rate minimal, dan perks bonus.
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
            <div className="col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Nama Rank Tier</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Min. Omset Bulanan (Rp)</label>
              <input
                type="number"
                min={0}
                value={formData.minMonthlyOmset}
                onChange={e => setFormData({ ...formData, minMonthlyOmset: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-black text-theme outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Min. Conversion Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={formData.minConversionRate}
                onChange={e => setFormData({ ...formData, minConversionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-black text-theme outline-none font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Perks & Keuntungan Rank</label>
              <textarea
                rows={2}
                value={formData.perks}
                onChange={e => setFormData({ ...formData, perks: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none resize-none"
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
              Simpan Rank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
