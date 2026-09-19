import React, { useState, useEffect } from 'react';
import { X, Coins, Zap, AlertCircle } from 'lucide-react';
import { ActionXpConfig } from '../../types';

interface EditBaseRewardModalProps {
  rewardKey:
    | 'newLead'
    | 'followUp'
    | 'quotation'
    | 'successfulOrder'
    | 'dailyStreakBonus'
    | null;
  config: ActionXpConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedConfig: ActionXpConfig) => void;
}

export const EditBaseRewardModal: React.FC<EditBaseRewardModalProps> = ({
  rewardKey,
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const [xp, setXp] = useState(0);
  const [bpc, setBpc] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const getRewardInfo = () => {
    switch (rewardKey) {
      case 'newLead':
        return {
          title: 'Base Reward: Tambah Lead Baru',
          desc: 'Hadiah otomatis saat operator CS memasukkan data prospek baru ke Hunt Log.',
        };
      case 'followUp':
        return {
          title: 'Base Reward: Update Follow-up',
          desc: 'Hadiah otomatis saat operator memperbarui status follow-up customer.',
        };
      case 'quotation':
        return {
          title: 'Base Reward: Kirim Quotation',
          desc: 'Hadiah otomatis saat operator mengirimkan draft penawaran harga.',
        };
      case 'successfulOrder':
        return {
          title: 'Base Reward: Catat Order Closing',
          desc: 'Hadiah dasar saat transaksi penjualan berhasil lunas dan invoice diterbitkan.',
        };
      case 'dailyStreakBonus':
        return {
          title: 'Base Reward: Daily Streak Bonus',
          desc: 'Bonus pencapaian konsistensi kerja hunter setiap hari berturut-turut.',
        };
      default:
        return { title: 'Konfigurasi Base Reward', desc: '' };
    }
  };

  useEffect(() => {
    if (!rewardKey) return;
    if (rewardKey === 'newLead') {
      setXp(config.newLeadXp);
      setBpc(config.newLeadBpc ?? 0);
      setIsActive(config.newLeadActive ?? true);
    } else if (rewardKey === 'followUp') {
      setXp(config.followUpXp);
      setBpc(config.followUpBpc ?? 0);
      setIsActive(config.followUpActive ?? true);
    } else if (rewardKey === 'quotation') {
      setXp(config.quotationXp);
      setBpc(config.quotationBpc ?? 0);
      setIsActive(config.quotationActive ?? true);
    } else if (rewardKey === 'successfulOrder') {
      setXp(config.successfulOrderXp);
      setBpc(config.successfulOrderBpc ?? 15);
      setIsActive(config.successfulOrderActive ?? true);
    } else if (rewardKey === 'dailyStreakBonus') {
      setXp(config.dailyStreakBonusXp);
      setBpc(config.dailyStreakBonusBpc ?? 10);
      setIsActive(config.dailyStreakBonusActive ?? true);
    }
  }, [rewardKey, config, isOpen]);

  if (!isOpen || !rewardKey) return null;

  const { title, desc } = getRewardInfo();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...config };

    if (rewardKey === 'newLead') {
      updated.newLeadXp = Number(xp);
      updated.newLeadBpc = Number(bpc);
      updated.newLeadActive = isActive;
    } else if (rewardKey === 'followUp') {
      updated.followUpXp = Number(xp);
      updated.followUpBpc = Number(bpc);
      updated.followUpActive = isActive;
    } else if (rewardKey === 'quotation') {
      updated.quotationXp = Number(xp);
      updated.quotationBpc = Number(bpc);
      updated.quotationActive = isActive;
    } else if (rewardKey === 'successfulOrder') {
      updated.successfulOrderXp = Number(xp);
      updated.successfulOrderBpc = Number(bpc);
      updated.successfulOrderActive = isActive;
    } else if (rewardKey === 'dailyStreakBonus') {
      updated.dailyStreakBonusXp = Number(xp);
      updated.dailyStreakBonusBpc = Number(bpc);
      updated.dailyStreakBonusActive = isActive;
    }

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="edit-base-reward-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="edit-base-reward-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-md w-full bg-surface border border-theme shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 text-xl font-bold">
              🪙
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-theme">{title}</h3>
              <p className="text-xs text-theme-muted">{desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-sky-500 mb-1">XP Reward (+XP)</label>
              <input
                type="number"
                min={0}
                value={xp}
                onChange={e => setXp(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-black text-sky-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1">BPC Reward (+BPC)</label>
              <input
                type="number"
                min={0}
                value={bpc}
                onChange={e => setBpc(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-black text-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-theme">
            <div>
              <span className="text-xs font-bold text-theme">Status Hadiah</span>
              <p className="text-[11px] text-theme-muted">Aktifkan atau jeda pembagian reward ini.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-surface-alt text-theme-muted border border-theme'
              }`}
            >
              {isActive ? '✓ Aktif' : 'Non-aktif'}
            </button>
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
              Simpan Reward
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
