import React, { useState, useEffect } from 'react';
import { X, Award, Sparkles, Target, Zap, Shield, Crown, Flame, AlertCircle, Users, User } from 'lucide-react';
import {
  BountyTemplate,
  BountyFrequency,
  BountyTargetType,
  BountyDifficulty,
  BountyRarity,
  BountyMode,
  TeamRewardMode,
  Channel,
} from '../../types';

interface BountyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: Partial<BountyTemplate>, isEdit: boolean, templateId?: string) => void;
  bountyToEdit?: BountyTemplate | null;
}

export const BountyFormModal: React.FC<BountyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bountyToEdit,
}) => {
  const isEdit = !!bountyToEdit;

  const [formData, setFormData] = useState<Partial<BountyTemplate>>({
    name: '',
    description: '',
    frequency: 'DAILY',
    rarity: 'Common',
    difficulty: 'Normal',
    targetType: 'LEADS',
    targetValue: 5,
    channelScope: 'ALL',
    hunterScope: 'ALL',
    bountyMode: 'SOLO',
    teamRewardMode: 'TOP_CONTRIBUTOR',
    xpReward: 50,
    bpcReward: 25,
    requiredLevel: 1,
    iconName: 'Target',
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bountyToEdit) {
      setFormData({
        name: bountyToEdit.name,
        description: bountyToEdit.description,
        frequency: bountyToEdit.frequency,
        rarity: bountyToEdit.rarity,
        difficulty: bountyToEdit.difficulty,
        targetType: bountyToEdit.targetType,
        targetValue: bountyToEdit.targetValue,
        channelScope: bountyToEdit.channelScope,
        hunterScope: bountyToEdit.hunterScope,
        bountyMode: bountyToEdit.bountyMode || 'SOLO',
        teamRewardMode: bountyToEdit.teamRewardMode || 'TOP_CONTRIBUTOR',
        xpReward: bountyToEdit.xpReward,
        bpcReward: bountyToEdit.bpcReward,
        requiredLevel: bountyToEdit.requiredLevel,
        iconName: bountyToEdit.iconName || 'Target',
        isActive: bountyToEdit.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        frequency: 'DAILY',
        rarity: 'Common',
        difficulty: 'Normal',
        targetType: 'LEADS',
        targetValue: 5,
        channelScope: 'ALL',
        hunterScope: 'ALL',
        bountyMode: 'SOLO',
        teamRewardMode: 'TOP_CONTRIBUTOR',
        xpReward: 50,
        bpcReward: 25,
        requiredLevel: 1,
        iconName: 'Target',
        isActive: true,
      });
    }
    setErrorMsg(null);
  }, [bountyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Nama bounty wajib diisi.');
      return;
    }
    if (!formData.targetValue || formData.targetValue <= 0) {
      setErrorMsg('Target nilai harus lebih besar dari 0.');
      return;
    }

    onSubmit(formData, isEdit, bountyToEdit?.id);
    onClose();
  };

  return (
    <div
      id="bounty-form-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="bounty-form-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-2xl w-full max-h-[90vh] flex flex-col bg-surface border border-theme shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl font-bold">
              {isEdit ? '✏️' : '⚔️'}
            </div>
            <div>
              <h3 className="font-black text-base text-theme">
                {isEdit ? 'EDIT BOUNTY & QUEST TEMPLATE' : 'FORGE NEW BOUNTY QUEST'}
              </h3>
              <p className="text-xs text-theme-muted">
                {isEdit
                  ? `Memodifikasi parameter quest ID: ${bountyToEdit?.id}`
                  : 'Konfigurasikan misi berhadiah XP dan BPC untuk tim Hunter Web Order.'}
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

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Nama Bounty Quest *</label>
              <input
                type="text"
                required
                placeholder="cth. Weekend Closing Blitz, Mega Omset Rush"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-semibold text-theme outline-none focus:border-theme-highlight"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-theme mb-1">Deskripsi Quest</label>
              <textarea
                rows={2}
                placeholder="cth. Capai minimal 5 transaksi closing lunas di akhir pekan..."
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-theme-highlight resize-none"
              />
            </div>

            {/* Mode Bounty: SOLO vs TEAM */}
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Tipe Partisipasi (Mode)</label>
              <select
                value={formData.bountyMode || 'SOLO'}
                onChange={e => setFormData({ ...formData, bountyMode: e.target.value as BountyMode })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              >
                <option value="SOLO">👤 SOLO (Progress Individu Hunter)</option>
                <option value="TEAM">👥 TEAM (Progress Kolektif Semua Hunter)</option>
              </select>
            </div>

            {/* Team Reward Distribution if TEAM */}
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Distribusi Hadiah Tim</label>
              <select
                disabled={formData.bountyMode !== 'TEAM'}
                value={formData.teamRewardMode || 'TOP_CONTRIBUTOR'}
                onChange={e => setFormData({ ...formData, teamRewardMode: e.target.value as TeamRewardMode })}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none ${
                  formData.bountyMode !== 'TEAM' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="TOP_CONTRIBUTOR">🏆 Top Contributor (MVP Saja)</option>
                <option value="PROPORTIONAL">📊 Proporsional (Sesuai % Kontribusi)</option>
                <option value="EQUAL">🤝 Rata / Setara (Semua Kontributor)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Frekuensi Reset (WITA)</label>
              <select
                value={formData.frequency}
                onChange={e => setFormData({ ...formData, frequency: e.target.value as BountyFrequency })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              >
                <option value="DAILY">Daily (Reset Tiap 00:00 WITA)</option>
                <option value="WEEKLY">Weekly (Reset Senin 00:00 WITA)</option>
                <option value="MONTHLY">Monthly (Reset Tgl 1 00:00 WITA)</option>
                <option value="BOSS">Boss Bounty (Misi Akbar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Target Metrik</label>
              <select
                value={formData.targetType}
                onChange={e => setFormData({ ...formData, targetType: e.target.value as BountyTargetType })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
              >
                <option value="LEADS">Jumlah Leads Masuk</option>
                <option value="SUCCESSFUL_ORDERS">Jumlah Order Closing</option>
                <option value="OMSET">Nominal Omset (Rupiah)</option>
                <option value="CONVERSION_RATE">Conversion Rate (%)</option>
                <option value="FOLLOW_UPS">Jumlah Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">
                Nilai Target {formData.targetType === 'OMSET' ? '(Rp)' : formData.targetType === 'CONVERSION_RATE' ? '(%)' : '(Unit)'} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.targetValue || 0}
                onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-black text-theme outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Rarity & Tingkat Kesulitan</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formData.rarity}
                  onChange={e => setFormData({ ...formData, rarity: e.target.value as BountyRarity })}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
                >
                  <option value="Common">Common</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Boss">Boss</option>
                </select>

                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value as BountyDifficulty })}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Hard">Hard</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-500 mb-1">Hadiah XP Reward</label>
              <input
                type="number"
                min={0}
                value={formData.xpReward || 0}
                onChange={e => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-sky-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1">Hadiah Bounty Pearl Coin (BPC)</label>
              <input
                type="number"
                min={0}
                value={formData.bpcReward || 0}
                onChange={e => setFormData({ ...formData, bpcReward: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-amber-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Scope Channel</label>
              <select
                value={formData.channelScope || 'ALL'}
                onChange={e => setFormData({ ...formData, channelScope: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-semibold text-theme outline-none"
              >
                <option value="ALL">Semua Channel (All)</option>
                <option value="WhatsApp">WhatsApp Only</option>
                <option value="Website">Website Only</option>
                <option value="Shopee">Shopee Only</option>
                <option value="Instagram">Instagram Only</option>
                <option value="TikTok Shop">TikTok Shop Only</option>
                <option value="Tokopedia">Tokopedia Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Syarat Minimal Level Hunter</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.requiredLevel || 1}
                onChange={e => setFormData({ ...formData, requiredLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none font-mono"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="pt-3 border-t border-theme flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-theme">Status Keaktifan Bounty</span>
              <p className="text-[11px] text-theme-muted">
                Bounty aktif akan otomatis muncul di papan Bounty Board para Hunter.
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
              {formData.isActive ? '✓ Aktif' : 'Non-aktif'}
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
              className="px-6 py-2.5 rounded-xl bg-theme-primary text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition-all"
            >
              {isEdit ? 'Simpan Perubahan' : 'Buat Quest Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

