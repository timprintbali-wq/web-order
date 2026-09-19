import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Palette,
  Award,
  Crown,
  Shield,
  Coins,
  Package,
  Users,
  Database,
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle,
  Download,
  Upload,
  RefreshCcw,
  Sparkles,
  AlertTriangle,
  Flame,
  Zap,
  Target,
  Gem,
  Lock,
  Eye,
  Check,
  Edit3,
  UserPlus,
  Eraser,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PRESET_THEMES } from '../../types/theme';
import {
  BountyTemplate,
  BountyFrequency,
  BountyTargetType,
  BountyDifficulty,
  BountyRarity,
  CosmeticItem,
  CosmeticType,
  LevelTier,
  RankTier,
  User,
  UserRole,
} from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { DeleteBountyModal } from '../modals/DeleteBountyModal';
import { BountyFormModal } from '../modals/BountyFormModal';
import { ForgeCosmeticModal } from '../modals/ForgeCosmeticModal';
import { DeleteCosmeticModal } from '../modals/DeleteCosmeticModal';
import { DeleteHunterModal } from '../modals/DeleteHunterModal';
import { EditProfileModal } from '../modals/EditProfileModal';
import { EditLevelModal } from '../modals/EditLevelModal';
import { EditRankModal } from '../modals/EditRankModal';
import { EditBaseRewardModal } from '../modals/EditBaseRewardModal';
import { ResetOperationalModal } from '../modals/ResetOperationalModal';
import { FactoryResetModal } from '../modals/FactoryResetModal';
import { ProfileTitleBadge } from '../common/ProfileTitleBadge';
import { BpcCoinIcon } from '../common/BpcCoinIcon';
import { getFirebaseStatus } from '../../lib/firebase';

export const ControlRoomView: React.FC = () => {
  const { themeId, setTheme, allThemes } = useTheme();
  const { currentUser, users, createUser, updateUser, toggleUserActive, deleteUser, equipUserCosmetic } = useAuth();
  const {
    bountyTemplates,
    createBountyTemplate,
    updateBountyTemplate,
    duplicateBountyTemplate,
    toggleBountyTemplate,
    deleteBountyTemplate,
    cosmetics,
    addCosmeticItem,
    updateCosmeticItem,
    deleteCosmeticItem,
    levelTiers,
    updateLevelTiers,
    rankTiers,
    updateRankTiers,
    actionXpConfig,
    updateActionXpConfig,
    hunterStats,
    exportBackupJson,
    importBackupJson,
    resetOperationalData,
    factoryReset,
    resetToDefaultData,
    targetConfig,
    updateTargetConfig,
    stats,
  } = useData();

  // Sub-tabs
  const [activeSubNav, setActiveSubNav] = useState<
    'themes' | 'targets' | 'bounties' | 'levels' | 'rewards' | 'cosmetics' | 'users' | 'system'
  >('themes');

  // --- OMSET & TARGET STATE ---
  const [targetForm, setTargetForm] = useState({
    monthlyTarget: targetConfig?.monthlyTarget || 150000000,
    dailyTarget: targetConfig?.dailyTarget || 5000000,
  });

  React.useEffect(() => {
    if (targetConfig) {
      setTargetForm({
        monthlyTarget: targetConfig.monthlyTarget,
        dailyTarget: targetConfig.dailyTarget,
      });
    }
  }, [targetConfig]);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // --- SYSTEM RESET MODALS STATE ---
  const [isResetOperationalModalOpen, setIsResetOperationalModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);

  // --- BOUNTY MODALS STATE ---
  const [isBountyFormOpen, setIsBountyFormOpen] = useState(false);
  const [bountyToEdit, setBountyToEdit] = useState<BountyTemplate | null>(null);
  const [bountyToDelete, setBountyToDelete] = useState<BountyTemplate | null>(null);
  const [isDeletingBounty, setIsDeletingBounty] = useState(false);

  // --- COSMETIC MODALS STATE ---
  const [selectedCosmeticCategory, setSelectedCosmeticCategory] = useState<
    'ALL' | 'Profile Frame' | 'Achievement Badge' | 'Profile Title' | 'BPC Coin' | 'Treasure Map' | 'Theme'
  >('ALL');
  const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
  const [cosmeticToEdit, setCosmeticToEdit] = useState<CosmeticItem | null>(null);
  const [cosmeticToDelete, setCosmeticToDelete] = useState<CosmeticItem | null>(null);
  const [isDeletingCosmetic, setIsDeletingCosmetic] = useState(false);

  // --- HUNTER MODALS STATE ---
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    username: string;
    displayName: string;
    role: UserRole;
    passwordPlain: string;
  }>({
    username: '',
    displayName: '',
    role: 'HUNTER',
    passwordPlain: '',
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingHunterUser, setEditingHunterUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // --- LEVEL & RANK MODALS STATE ---
  const [levelToEdit, setLevelToEdit] = useState<LevelTier | null>(null);
  const [isNewLevelModal, setIsNewLevelModal] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [rankToEdit, setRankToEdit] = useState<RankTier | null>(null);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  // --- BASE REWARDS MODAL STATE ---
  const [baseRewardKeyToEdit, setBaseRewardKeyToEdit] = useState<
    'newLead' | 'followUp' | 'quotation' | 'successfulOrder' | 'dailyStreakBonus' | null
  >(null);

  // ==================== HANDLERS ====================

  // Bounty CRUD
  const handleSaveBountyForm = (
    formData: Partial<BountyTemplate>,
    isEdit: boolean,
    templateId?: string
  ) => {
    if (isEdit && templateId) {
      updateBountyTemplate(templateId, formData);
      setFeedbackMsg({ text: `Bounty "${formData.name}" berhasil diperbarui!`, isError: false });
    } else {
      createBountyTemplate({
        name: formData.name || 'New Bounty',
        description: formData.description || '',
        frequency: formData.frequency || 'DAILY',
        rarity: formData.rarity || 'Common',
        targetType: formData.targetType || 'LEADS',
        targetValue: formData.targetValue || 5,
        channelScope: formData.channelScope || 'ALL',
        hunterScope: formData.hunterScope || 'ALL',
        bountyMode: formData.bountyMode || 'SOLO',
        teamRewardMode: formData.teamRewardMode || 'TOP_CONTRIBUTOR',
        difficulty: formData.difficulty || 'Normal',
        xpReward: formData.xpReward || 50,
        bpcReward: formData.bpcReward || 25,
        requiredLevel: formData.requiredLevel || 1,
        iconName: formData.iconName || 'Target',
        isActive: formData.isActive ?? true,
      });
      setFeedbackMsg({ text: `Bounty "${formData.name}" berhasil dibuat!`, isError: false });
    }
  };

  const handleConfirmDeleteBounty = (bountyId: string) => {
    setIsDeletingBounty(true);
    const res = deleteBountyTemplate(bountyId);
    setIsDeletingBounty(false);
    if (res.success) {
      setFeedbackMsg({ text: 'Bounty berhasil dihapus.', isError: false });
      setBountyToDelete(null);
    } else {
      setFeedbackMsg({ text: res.error || 'Gagal menghapus bounty.', isError: true });
    }
  };

  // Cosmetic CRUD
  const handleSaveCosmeticForm = (
    formData: Partial<CosmeticItem>,
    isEdit: boolean,
    cosmeticId?: string
  ) => {
    if (isEdit && cosmeticId) {
      updateCosmeticItem(cosmeticId, formData);
      setFeedbackMsg({ text: `Item "${formData.name}" berhasil diperbarui!`, isError: false });
    } else {
      addCosmeticItem({
        name: formData.name || 'New Cosmetic',
        description: formData.description || '',
        type: formData.type || 'Profile Frame',
        rarity: formData.rarity || 'Common',
        assetUrl: formData.assetUrl || '',
        previewAssetUrl: formData.previewAssetUrl || formData.assetUrl || '',
        bpcPrice: formData.bpcPrice ?? 250,
        unlockMethod: formData.unlockMethod || 'Purchase with BPC',
        unlockRequirement: formData.unlockRequirement || 'Beli di Bounty Shop',
        requiredLevel: formData.requiredLevel || 1,
        isActive: formData.isActive ?? true,
        sortOrder: cosmetics.length + 1,
      });
      setFeedbackMsg({ text: `Item "${formData.name}" berhasil ditambahkan ke Shop!`, isError: false });
    }
  };

  const handleConfirmDeleteCosmetic = (cosmeticId: string) => {
    setIsDeletingCosmetic(true);
    deleteCosmeticItem(cosmeticId);
    setIsDeletingCosmetic(false);
    setFeedbackMsg({ text: 'Item kosmetik berhasil dihapus dari katalog.', isError: false });
    setCosmeticToDelete(null);
  };

  const handleDuplicateCosmetic = (item: CosmeticItem) => {
    addCosmeticItem({
      name: `${item.name} (Copy)`,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      assetUrl: item.assetUrl,
      previewAssetUrl: item.previewAssetUrl,
      bpcPrice: item.bpcPrice,
      unlockMethod: item.unlockMethod,
      unlockRequirement: item.unlockRequirement,
      requiredLevel: item.requiredLevel,
      isActive: item.isActive,
      sortOrder: cosmetics.length + 1,
    });
    setFeedbackMsg({ text: `Item "${item.name}" berhasil diduplikasi!`, isError: false });
  };

  // Hunter CRUD
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.displayName) {
      setFeedbackMsg({ text: 'Username dan Display Name wajib diisi!', isError: true });
      return;
    }

    const res = await createUser(newUserForm);
    if (res.success) {
      setFeedbackMsg({
        text: `Akun Hunter "${newUserForm.displayName}" berhasil ditambahkan!`,
        isError: false,
      });
      setShowNewUserModal(false);
      setNewUserForm({
        username: '',
        displayName: '',
        role: 'HUNTER',
        passwordPlain: '',
      });
    } else {
      setFeedbackMsg({ text: res.error || 'Gagal menambahkan user.', isError: true });
    }
  };

  const handleConfirmDeleteUser = (userId: string) => {
    setIsDeletingUser(true);
    const res = deleteUser(userId);
    setIsDeletingUser(false);
    if (res.success) {
      setFeedbackMsg({
        text: 'Akun Hunter berhasil dihapus. Seluruh data historis bisnis tetap tersimpan 100% aman.',
        isError: false,
      });
      setUserToDelete(null);
    } else {
      setFeedbackMsg({ text: res.error || 'Gagal menghapus akun.', isError: true });
    }
  };

  // Level & Rank Updates
  const handleSaveLevelTier = (updatedLevel: LevelTier, isNew?: boolean) => {
    if (isNew) {
      updateLevelTiers([...levelTiers, updatedLevel].sort((a, b) => a.level - b.level));
      setFeedbackMsg({ text: `Level ${updatedLevel.level} berhasil ditambahkan!`, isError: false });
    } else {
      updateLevelTiers(levelTiers.map(l => (l.level === updatedLevel.level ? updatedLevel : l)));
      setFeedbackMsg({ text: `Level ${updatedLevel.level} berhasil diperbarui!`, isError: false });
    }
  };

  const handleSaveRankTier = (updatedRank: RankTier) => {
    updateRankTiers(rankTiers.map(r => (r.id === updatedRank.id ? updatedRank : r)));
    setFeedbackMsg({ text: `Rank "${updatedRank.name}" berhasil diperbarui!`, isError: false });
  };

  // Base Rewards Update
  const handleSaveBaseReward = (newConfig: typeof actionXpConfig) => {
    updateActionXpConfig(newConfig);
    setFeedbackMsg({ text: 'Konfigurasi Base Rewards berhasil disimpan!', isError: false });
  };

  // Backup & Restore
  const handleExport = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bpc_guild_library_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMsg({ text: 'Database Guild Library berhasil diexport ke JSON!', isError: false });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = importBackupJson(content);
      if (success) {
        setFeedbackMsg({ text: 'Database berhasil di-restore dari file JSON!', isError: false });
      } else {
        setFeedbackMsg({ text: 'Format file backup tidak valid!', isError: true });
      }
    };
    reader.readAsText(file);
  };

  // Filtered cosmetics
  const filteredCosmetics = cosmetics.filter(item => {
    if (selectedCosmeticCategory === 'ALL') return true;
    return item.type === selectedCosmeticCategory;
  });

  return (
    <div id="guild-library-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="card-theme p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-base sm:text-lg font-black text-theme">GUILD LIBRARY</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Master Armory & Configuration Hub
            </span>
          </div>
          <p className="text-xs text-theme-muted mt-0.5">
            Pusat konfigurasi resmi RPG Web Order: Bounties, Quests, Cosmetics, Hunter Accounts, Level Tiers, Ranks, Base Rewards, dan Wizard Merchant Assets.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="card-theme p-2 flex items-center overflow-x-auto gap-1">
        {[
          { id: 'themes', label: 'Tema & Tampilan', icon: Palette },
          { id: 'targets', label: 'Omset & Target', icon: Target },
          { id: 'bounties', label: 'Quest & Bounty Manager', icon: Award },
          { id: 'cosmetics', label: 'Wizard Merchant & Asset Forge', icon: Package },
          { id: 'levels', label: 'Level & Rank', icon: Crown },
          { id: 'rewards', label: 'Base Rewards', icon: Coins },
          { id: 'users', label: 'Manajemen Hunter & Guild Master', icon: Users },
          { id: 'system', label: 'Sistem & Backup', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubNav === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubNav(tab.id as any);
                setFeedbackMsg(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme hover:bg-surface-alt'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Alert Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedbackMsg.isError
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OMSET & TARGET SETTINGS */}
      {/* ========================================================================= */}
      {activeSubNav === 'targets' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="border-b border-theme pb-4">
            <h3 className="font-black text-base text-theme">PENGATURAN TARGET OMSET (GUILD CONTROL ROOM)</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Atur target omset bulanan dan harian divisi Web Order Bali Printing Center. Nilai target ini langsung terintegrasi secara real-time ke Overview Progress KPI, Sales Analytics, dan sistem Gamifikasi Bounty.
            </p>
          </div>

          {/* Real-time KPI Target Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface-alt border border-theme space-y-1">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Target Bulanan Tim</span>
              <div className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono">
                {formatRupiah(targetForm.monthlyTarget)}
              </div>
              <div className="text-xs text-theme-secondary flex items-center justify-between pt-1 border-t border-theme">
                <span>Realisasi Saat Ini:</span>
                <span className="font-bold text-theme">{formatRupiah(stats.omsetThisMonth, true)}</span>
              </div>
              <div className="text-[11px] text-theme-muted">
                Pencapaian: <strong className="text-theme font-bold">{targetForm.monthlyTarget > 0 ? Math.round((stats.omsetThisMonth / targetForm.monthlyTarget) * 100) : 0}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-alt border border-theme space-y-1">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Target Harian Tim</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatRupiah(targetForm.dailyTarget)}
              </div>
              <div className="text-xs text-theme-secondary flex items-center justify-between pt-1 border-t border-theme">
                <span>Realisasi Hari Ini:</span>
                <span className="font-bold text-theme">{formatRupiah(stats.omsetToday, true)}</span>
              </div>
              <div className="text-[11px] text-theme-muted">
                Pencapaian: <strong className="text-theme font-bold">{targetForm.dailyTarget > 0 ? Math.round((stats.omsetToday / targetForm.dailyTarget) * 100) : 0}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-alt border border-theme space-y-1">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Target Rata-Rata per Hunter</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {formatRupiah(Math.round(targetForm.monthlyTarget / 3))}
              </div>
              <div className="text-xs text-theme-muted pt-1 border-t border-theme">
                Berdasarkan alokasi 3 CS Online aktif di Bali Printing Center.
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form
            onSubmit={e => {
              e.preventDefault();
              updateTargetConfig({
                monthlyTarget: Number(targetForm.monthlyTarget),
                dailyTarget: Number(targetForm.dailyTarget),
              });
              setFeedbackMsg({
                text: `Target Omset berhasil diperbarui! (Bulanan: ${formatRupiah(Number(targetForm.monthlyTarget))}, Harian: ${formatRupiah(Number(targetForm.dailyTarget))})`,
                isError: false,
              });
            }}
            className="space-y-6 max-w-2xl bg-surface-alt/40 p-5 rounded-2xl border border-theme"
          >
            {/* Monthly Target */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-theme uppercase tracking-wider">
                1. Target Omset Bulanan (IDR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-theme-muted">
                  Rp
                </span>
                <input
                  id="input-monthly-target"
                  type="number"
                  required
                  min="1000000"
                  step="1"
                  value={targetForm.monthlyTarget}
                  onChange={e => setTargetForm({ ...targetForm, monthlyTarget: Number(e.target.value) })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface border border-theme text-sm font-black text-theme font-mono outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-theme-muted font-semibold mr-1">Preset Cepat:</span>
                {[50000000, 100000000, 150000000, 200000000, 250000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTargetForm(prev => ({ ...prev, monthlyTarget: val }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      targetForm.monthlyTarget === val
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-surface border-theme text-theme-muted hover:text-theme'
                    }`}
                  >
                    {formatRupiah(val, true)}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-theme uppercase tracking-wider">
                  2. Target Omset Harian (IDR) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const calculatedDaily = Math.round(targetForm.monthlyTarget / 30);
                    setTargetForm(prev => ({ ...prev, dailyTarget: calculatedDaily }));
                  }}
                  className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
                >
                  Hitung Otomatis (Bulanan ÷ 30)
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-theme-muted">
                  Rp
                </span>
                <input
                  id="input-daily-target"
                  type="number"
                  required
                  min="100000"
                  step="1"
                  value={targetForm.dailyTarget}
                  onChange={e => setTargetForm({ ...targetForm, dailyTarget: Number(e.target.value) })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface border border-theme text-sm font-black text-theme font-mono outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-theme-muted font-semibold mr-1">Preset Cepat:</span>
                {[1500000, 3000000, 5000000, 7500000, 10000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTargetForm(prev => ({ ...prev, dailyTarget: val }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      targetForm.dailyTarget === val
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-surface border-theme text-theme-muted hover:text-theme'
                    }`}
                  >
                    {formatRupiah(val, true)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-save-target-config"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Konfigurasi Target</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. THEMES & APPEARANCE (Unified Catalog with SAKURA FREE & Custom Themes) */}
      {/* ========================================================================= */}
      {activeSubNav === 'themes' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div>
              <h3 className="font-black text-base text-theme">TEMA & TAMPILAN DASHBOARD</h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Katalog tema terpadu (Unified Theme Catalog). Pilih tema untuk langsung diterapkan ke seluruh sistem. Tema Sakura dan tema bawaan lainnya terintegrasi penuh dengan Cosmetic Shop.
              </p>
            </div>
            <button
              onClick={() => {
                setCosmeticToEdit(null);
                setSelectedCosmeticCategory('Theme');
                setIsForgeModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tempa Tema Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(() => {
              const themeCosmetics = cosmetics.filter(c => c.type === 'Theme' && c.isActive);
              const themeList = themeCosmetics.length > 0
                ? themeCosmetics
                : Object.values(allThemes || PRESET_THEMES).map(pt => ({
                    id: pt.id,
                    name: pt.name,
                    description: pt.description,
                    type: 'Theme' as const,
                    rarity: 'Common' as const,
                    assetUrl: pt.id,
                    previewAssetUrl: '',
                    bpcPrice: 0,
                    unlockMethod: 'Level Unlock' as const,
                    unlockRequirement: 'Bawaan Sistem',
                    requiredLevel: 1,
                    isActive: true,
                    sortOrder: 1,
                    themeDefinition: pt,
                    createdAt: new Date().toISOString(),
                  }));

              return themeList.map(t => {
                const def = t.themeDefinition || allThemes[t.assetUrl] || allThemes[t.id] || PRESET_THEMES.vibrant;
                const canonicalThemeId = (t.assetUrl || t.themeDefinition?.id || t.id || '').replace(/^theme_/, '');
                const currentThemeNorm = (themeId || '').replace(/^theme_/, '');
                const userThemeNorm = (currentUser.equippedTheme || '').replace(/^theme_/, '');
                const isSelected = currentThemeNorm === canonicalThemeId || userThemeNorm === canonicalThemeId;
                const isSakura = canonicalThemeId === 'sakura' || t.name.toLowerCase().includes('sakura');
                const isFree = t.bpcPrice === 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      const targetThemeId = t.assetUrl || t.themeDefinition?.id || t.id;
                      setTheme(targetThemeId);
                      equipUserCosmetic('Theme', targetThemeId);
                      setFeedbackMsg({
                        text: `Tema "${t.name}" berhasil diterapkan ke seluruh dashboard!`,
                        isError: false,
                      });
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                      isSelected
                        ? 'border-orange-500 shadow-lg bg-surface-alt ring-2 ring-orange-500/20'
                        : 'border-theme hover:border-theme-muted bg-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-theme flex items-center gap-1.5 truncate">
                          {t.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isSakura || isFree ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 border border-pink-500/30">
                              FREE
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              🪙 {t.bpcPrice} BPC
                            </span>
                          )}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-theme-muted mb-4 leading-relaxed line-clamp-2">
                        {t.description || def.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {/* Glow effect indicator if present */}
                      {def.effects?.surfaceGlow?.enabled && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                          <Sparkles className="w-3 h-3" />
                          <span>Outer Glow Aktif</span>
                        </div>
                      )}

                      {/* Color Swatch Preview */}
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-theme">
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: def.colors.primary }}
                          title="Primary Color"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: def.colors.secondary }}
                          title="Secondary Color"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: def.colors.accentGold }}
                          title="Accent Gold"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: def.colors.surface }}
                          title="Surface Background"
                        />
                        <span className="text-[10px] font-mono text-theme-muted ml-auto">
                          {def.isDark ? 'Dark' : 'Light'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. QUEST & BOUNTY MANAGER (With Edit, Activate/Deactivate, Copy, Delete) */}
      {/* ========================================================================= */}
      {activeSubNav === 'bounties' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-theme pb-4">
            <div>
              <h3 className="font-black text-base text-theme">ADVANCED QUEST & BOUNTY MANAGER</h3>
              <p className="text-xs text-theme-muted">
                Atur wizard misi, frekuensi reset WITA, target metrik, reward XP/BPC, dan aksi Edit/Copy/Hapus.
              </p>
            </div>
            <button
              onClick={() => {
                setBountyToEdit(null);
                setIsBountyFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Bounty Baru</span>
            </button>
          </div>

          {/* Templates List */}
          <div className="space-y-3">
            {bountyTemplates.map(tmpl => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-theme">{tmpl.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {tmpl.frequency}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      tmpl.bountyMode === 'TEAM'
                        ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                    }`}>
                      {tmpl.bountyMode === 'TEAM' ? '👥 TEAM' : '👤 SOLO'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500">
                      {tmpl.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-theme-muted">
                      ID: {tmpl.id}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-1">{tmpl.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-theme-muted mt-2 font-medium">
                    <span>
                      Target:{' '}
                      <strong className="text-theme font-bold">
                        {tmpl.targetType === 'OMSET' ? formatRupiah(tmpl.targetValue) : `${tmpl.targetValue} Unit`}
                      </strong>
                    </span>
                    <span>
                      Reward:{' '}
                      <strong className="text-sky-500 font-bold">+{tmpl.xpReward} XP</strong> |{' '}
                      <strong className="text-amber-500 font-bold">+{tmpl.bpcReward} BPC</strong>
                    </span>
                    <span>Scope: {tmpl.hunterScope === 'ALL' ? 'Team BPC' : 'Individual'}</span>
                    <span>Min. Level: Lvl {tmpl.requiredLevel}</span>
                  </div>
                </div>

                {/* Actions: Edit, Activate/Deactivate, Copy, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Edit Action */}
                  <button
                    id={`edit-bounty-${tmpl.id}`}
                    onClick={() => {
                      setBountyToEdit(tmpl);
                      setIsBountyFormOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-theme text-theme hover:bg-surface-alt font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Edit Parameter Bounty"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Edit</span>
                  </button>

                  {/* Activate / Deactivate Toggle */}
                  <button
                    onClick={() => toggleBountyTemplate(tmpl.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      tmpl.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/30 hover:bg-slate-500/20'
                    }`}
                  >
                    {tmpl.isActive ? '✓ Aktif' : 'Non-aktif'}
                  </button>

                  {/* Copy / Duplicate Action */}
                  <button
                    onClick={() => duplicateBountyTemplate(tmpl.id)}
                    className="p-1.5 rounded-lg bg-surface border border-theme text-theme-muted hover:text-theme cursor-pointer"
                    title="Duplikasi Quest"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Action */}
                  <button
                    id={`delete-bounty-${tmpl.id}`}
                    onClick={() => setBountyToDelete(tmpl)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="Hapus Bounty"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COSMETIC SHOP & ASSET FORGE (4-5 Categories, Dimension Guides, Forge) */}
      {/* ========================================================================= */}
      {activeSubNav === 'cosmetics' && (
        <div className="space-y-6">
          {/* Dimension & Specification Guidelines */}
          <div className="card-theme p-5 sm:p-6 space-y-4">
            <div className="border-b border-theme pb-3">
              <h3 className="font-black text-base text-theme">PANDUAN ASSET & KOSMETIK BPC</h3>
              <p className="text-xs text-theme-muted">
                Spesifikasi resmi dimensi gambar & aset visual untuk integrasi kustomisasi baru di Guild Library.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-surface-alt border border-theme">
                <span className="text-xs font-black text-amber-500">Avatar Frames</span>
                <div className="text-xs font-black text-theme mt-1">512 × 512 px</div>
                <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">
                  PNG Transparan. Bingkai melingkar dengan bagian tengah tembus pandang untuk foto Hunter.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-alt border border-theme">
                <span className="text-xs font-black text-purple-500">Achievement Badges</span>
                <div className="text-xs font-black text-theme mt-1">256 × 256 px</div>
                <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">
                  SVG / PNG Transparan. Lencana vektor berdaya kontras tinggi untuk lencana pencapaian.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-alt border border-theme">
                <span className="text-xs font-black text-sky-500">Treasure Maps</span>
                <div className="text-xs font-black text-theme mt-1">1600 × 900 px (16:9)</div>
                <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">
                  WebP / PNG. Ilustrasi peta petualangan bertema kepulauan Bali & omset web order.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-alt border border-theme">
                <span className="text-xs font-black text-emerald-500">BPC Coins & Titles</span>
                <div className="text-xs font-black text-theme mt-1">512 × 512 px / Teks</div>
                <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">
                  Koin token 3D atau teks gelar kehormatan khusus hunter pencetak rekor.
                </p>
              </div>
            </div>
          </div>

          {/* Cosmetic Catalog Management */}
          <div className="card-theme p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
              <div>
                <h3 className="font-black text-base text-theme">KATALOG KOSMETIK & WIZARD MERCHANT ASSETS</h3>
                <p className="text-xs text-theme-muted">
                  Kelola item Wizard Merchant, edit harga BPC / Free, preview visual, dan aktifkan atau non-aktifkan item.
                </p>
              </div>

              <button
                onClick={() => {
                  setCosmeticToEdit(null);
                  setIsForgeModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Forge New Item</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'Semua Kategori' },
                { id: 'Profile Frame', label: 'Avatar Frames' },
                { id: 'Achievement Badge', label: 'Achievement Badges' },
                { id: 'Profile Title', label: 'Profile Titles' },
                { id: 'BPC Coin', label: 'BPC Coins' },
                { id: 'Treasure Map', label: 'Treasure Maps' },
                { id: 'Theme', label: 'Themes' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCosmeticCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCosmeticCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-surface-alt text-theme-muted hover:text-theme border border-theme'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCosmetics.map(item => (
                <div
                  key={item.id}
                  className="card-theme p-4 flex flex-col justify-between border border-theme hover:border-theme-highlight transition-all"
                >
                  <div>
                    {/* Top status & rarity */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {item.type} • {item.rarity}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    {/* Preview Asset */}
                    <div className="h-24 rounded-xl bg-surface-alt flex items-center justify-center mb-3 overflow-hidden border border-theme p-2">
                      {item.type === 'Theme' ? (
                        <div className="w-full h-full p-2 flex flex-col justify-between items-center rounded-lg bg-surface border border-theme/60">
                          <div className="flex items-center gap-1.5 w-full justify-between">
                            <span className="text-[10px] font-bold text-theme flex items-center gap-1">
                              <Palette className="w-3.5 h-3.5 text-purple-500" />
                              {item.themeDefinition?.isDark ? 'Dark' : 'Light'}
                            </span>
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{
                                  backgroundColor:
                                    item.themeDefinition?.colors.primary || '#f97316',
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{
                                  backgroundColor:
                                    item.themeDefinition?.colors.secondary || '#6366f1',
                                }}
                              />
                              <div
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{
                                  backgroundColor:
                                    item.themeDefinition?.colors.bg || '#f8fafc',
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-theme truncate">
                            {item.name}
                          </span>
                        </div>
                      ) : item.type === 'BPC Coin' ? (
                        <div className="flex items-center gap-2">
                          <BpcCoinIcon coinId={item.id} size="xl" />
                          <span className="text-xs font-bold text-theme font-mono">{item.name}</span>
                        </div>
                      ) : item.type === 'Profile Frame' ? (
                        <div className="relative">
                          <img
                            src={currentUser.avatarUrl}
                            alt="Preview"
                            className={`w-10 h-10 rounded-full object-cover ${item.assetUrl}`}
                          />
                        </div>
                      ) : item.type === 'Profile Title' ? (
                        <div className="flex items-center justify-center p-2">
                          <ProfileTitleBadge
                            titleText={item.name}
                            rarity={item.rarity}
                            size="sm"
                          />
                        </div>
                      ) : item.type === 'Treasure Map' ? (
                        <div className="w-full h-full flex items-center justify-center bg-sky-950/20 text-xs font-bold text-sky-500">
                          🗺️ {item.name}
                        </div>
                      ) : (
                        <div className="text-2xl">{item.assetUrl}</div>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-sm text-theme">{item.name}</h4>
                    <p className="text-xs text-theme-muted mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-theme-muted mt-3 pt-2 border-t border-theme font-medium">
                      <span className="font-mono text-amber-500 font-bold">
                        {item.bpcPrice === 0 ? 'FREE' : `${formatNumber(item.bpcPrice)} BPC`}
                      </span>
                      <span>Min. Lvl {item.requiredLevel}</span>
                    </div>
                  </div>

                  {/* Actions: Edit, Duplicate, Toggle Active, Delete */}
                  <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCosmeticToEdit(item);
                          setIsForgeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-surface border border-theme text-sky-500 hover:bg-surface-alt cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDuplicateCosmetic(item)}
                        className="p-1.5 rounded-lg bg-surface border border-theme text-theme-muted hover:text-theme cursor-pointer"
                        title="Duplikasi Item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCosmeticItem(item.id, { isActive: !item.isActive })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                          item.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Off'}
                      </button>

                      <button
                        onClick={() => setCosmeticToDelete(item)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/20 cursor-pointer"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LEVEL & RANK CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubNav === 'levels' && (
        <div className="space-y-6">
          {/* Level Tiers */}
          <div className="card-theme p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <h3 className="font-black text-base text-theme">KONFIGURASI LEVEL TIERS</h3>
                <p className="text-xs text-theme-muted">
                  Daftar ambang batas XP, gelar hunter, reward BPC koin, dan item yang terbuka pada setiap kenaikan level.
                </p>
              </div>

              <button
                onClick={() => {
                  setLevelToEdit(null);
                  setIsNewLevelModal(true);
                  setIsLevelModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-theme-primary text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Level</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {levelTiers.map(tier => (
                <div key={tier.level} className="p-3.5 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-theme">Level {tier.level}</span>
                      <span className="font-mono text-[10px] text-sky-500 font-bold">
                        {formatNumber(tier.minXp)} - {formatNumber(tier.maxXp)} XP
                      </span>
                    </div>
                    <div className="font-bold text-xs text-theme">{tier.title}</div>
                    <div className="text-[10px] text-amber-500 font-mono font-bold mt-1">
                      Bonus: +{tier.bpcReward} BPC
                    </div>
                    <div className="text-[10px] text-theme-muted mt-2 border-t border-theme pt-1.5">
                      🎁 {tier.unlockName}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-theme flex justify-end">
                    <button
                      onClick={() => {
                        setLevelToEdit(tier);
                        setIsNewLevelModal(false);
                        setIsLevelModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rank Tiers */}
          <div className="card-theme p-5 sm:p-7 space-y-4">
            <div className="border-b border-theme pb-3">
              <h3 className="font-black text-base text-theme">KONFIGURASI RANK TIERS</h3>
              <p className="text-xs text-theme-muted">
                Syarat omset bulanan, conversion rate minimal, dan perks keuntungan rank hunter.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {rankTiers.map(rank => (
                <div key={rank.id} className="p-3.5 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-1">{rank.icon}</div>
                    <div className="font-black text-xs text-theme">{rank.name}</div>
                    <div className="text-[11px] text-theme-muted mt-1 font-mono">
                      Min. {formatRupiah(rank.minMonthlyOmset, true)} / bln
                    </div>
                    <div className="text-[10px] text-theme-muted mt-0.5">
                      Min. Conv: {rank.minConversionRate}%
                    </div>
                    <div className="text-[10px] text-amber-500 font-semibold mt-2 pt-1 border-t border-theme">
                      {rank.perks}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-theme flex justify-end">
                    <button
                      onClick={() => {
                        setRankToEdit(rank);
                        setIsRankModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Rank</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BASE REWARDS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubNav === 'rewards' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="border-b border-theme pb-3">
            <h3 className="font-black text-base text-theme">NILAI BASE REWARDS OPERASIONAL</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Hadiah dasar XP dan BPC yang otomatis diperoleh Hunter pada setiap tindakan operasional di Hunt Log.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. New Lead */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-theme">Tambah Lead Baru</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      actionXpConfig.newLeadActive ?? true ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {actionXpConfig.newLeadActive ?? true ? 'Aktif' : 'Off'}
                  </span>
                </div>
                <div className="text-xl font-black text-sky-500 font-mono mt-1">
                  +{actionXpConfig.newLeadXp} XP
                </div>
                {actionXpConfig.newLeadBpc ? (
                  <div className="text-xs font-bold text-amber-500 font-mono">
                    +{actionXpConfig.newLeadBpc} BPC
                  </div>
                ) : null}
                <span className="text-[10px] text-theme-muted mt-1 block">Tiap input kontak prospek</span>
              </div>

              <button
                onClick={() => setBaseRewardKeyToEdit('newLead')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Konfigurasi</span>
              </button>
            </div>

            {/* 2. Follow-up */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-theme">Update Follow-up</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      actionXpConfig.followUpActive ?? true ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {actionXpConfig.followUpActive ?? true ? 'Aktif' : 'Off'}
                  </span>
                </div>
                <div className="text-xl font-black text-sky-500 font-mono mt-1">
                  +{actionXpConfig.followUpXp} XP
                </div>
                {actionXpConfig.followUpBpc ? (
                  <div className="text-xs font-bold text-amber-500 font-mono">
                    +{actionXpConfig.followUpBpc} BPC
                  </div>
                ) : null}
                <span className="text-[10px] text-theme-muted mt-1 block">Tiap interaksi prospek</span>
              </div>

              <button
                onClick={() => setBaseRewardKeyToEdit('followUp')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Konfigurasi</span>
              </button>
            </div>

            {/* 3. Quotation */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-theme">Kirim Quotation</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      actionXpConfig.quotationActive ?? true ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {actionXpConfig.quotationActive ?? true ? 'Aktif' : 'Off'}
                  </span>
                </div>
                <div className="text-xl font-black text-purple-500 font-mono mt-1">
                  +{actionXpConfig.quotationXp} XP
                </div>
                {actionXpConfig.quotationBpc ? (
                  <div className="text-xs font-bold text-amber-500 font-mono">
                    +{actionXpConfig.quotationBpc} BPC
                  </div>
                ) : null}
                <span className="text-[10px] text-theme-muted mt-1 block">Tiap draft penawaran harga</span>
              </div>

              <button
                onClick={() => setBaseRewardKeyToEdit('quotation')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Konfigurasi</span>
              </button>
            </div>

            {/* 4. Closing Order */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-theme">Catat Order Closing</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      actionXpConfig.successfulOrderActive ?? true ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {actionXpConfig.successfulOrderActive ?? true ? 'Aktif' : 'Off'}
                  </span>
                </div>
                <div className="text-xl font-black text-amber-500 font-mono mt-1">
                  +{actionXpConfig.successfulOrderXp} XP
                </div>
                <div className="text-xs font-bold text-amber-500 font-mono">
                  +{actionXpConfig.successfulOrderBpc ?? 15} BPC + Omset Scale
                </div>
                <span className="text-[10px] text-theme-muted mt-1 block">Tiap invoice order lunas</span>
              </div>

              <button
                onClick={() => setBaseRewardKeyToEdit('successfulOrder')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Konfigurasi</span>
              </button>
            </div>

            {/* 5. Daily Streak Bonus */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-theme">Daily Streak Bonus</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      actionXpConfig.dailyStreakBonusActive ?? true ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {actionXpConfig.dailyStreakBonusActive ?? true ? 'Aktif' : 'Off'}
                  </span>
                </div>
                <div className="text-xl font-black text-rose-500 font-mono mt-1">
                  +{actionXpConfig.dailyStreakBonusXp} XP
                </div>
                <div className="text-xs font-bold text-amber-500 font-mono">
                  +{actionXpConfig.dailyStreakBonusBpc ?? 10} BPC
                </div>
                <span className="text-[10px] text-theme-muted mt-1 block">Bonus konsistensi harian</span>
              </div>

              <button
                onClick={() => setBaseRewardKeyToEdit('dailyStreakBonus')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs font-bold text-sky-500 hover:bg-surface-alt flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. USER & HUNTER MANAGEMENT (With Safe Account Deletion & Profile Avatar Editing) */}
      {/* ========================================================================= */}
      {activeSubNav === 'users' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div>
              <h3 className="font-black text-base text-theme">MANAJEMEN HUNTER & GUILD MASTER</h3>
              <p className="text-xs text-theme-muted">
                Rekrut hunter baru, edit foto profil avatar & nama tampilan, atur role hak akses, status aktif/arsip, dan hapus akun secara aman tanpa merusak data historis.
              </p>
            </div>
            <button
              onClick={() => setShowNewUserModal(true)}
              className="px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Rekrut Hunter</span>
            </button>
          </div>

          <div className="space-y-3">
            {users.map(u => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.avatarUrl}
                    alt={u.displayName}
                    className={`w-11 h-11 rounded-full object-cover shrink-0 ring-2 ${
                      u.equippedFrame || 'ring-theme'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-theme flex items-center gap-2 flex-wrap">
                      <span className="truncate">{u.displayName}</span>
                      <span className="text-[10px] text-theme-muted font-mono">(@{u.username})</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500 text-white'
                            : u.role === 'VIEWER'
                            ? 'bg-blue-500 text-white'
                            : 'bg-surface border border-theme text-theme'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-theme-muted mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>Gelar:</span>
                      {(() => {
                        const tItem = u.equippedTitle && u.equippedTitle.trim() !== '' && u.equippedTitle !== 'none'
                          ? cosmetics.find(c => c.type === 'Profile Title' && (c.id === u.equippedTitle || c.name === u.equippedTitle))
                          : null;
                        if (tItem) {
                          return (
                            <ProfileTitleBadge
                              titleText={tItem.name}
                              rarity={tItem.rarity}
                              size="xs"
                            />
                          );
                        }
                        return <span className="text-theme-muted italic">Tidak ada gelar</span>;
                      })()}
                      <span>•</span>
                      <span>Saldo BPC:</span>
                      <span className="font-mono text-theme font-bold">🪙 {hunterStats[u.id]?.bpcBalance || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Edit Profile, Activate/Deactivate Toggle & Safe Delete */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    id={`edit-hunter-profile-${u.id}`}
                    onClick={() => setEditingHunterUser(u)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt text-theme border border-theme font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:border-orange-500/50"
                    title="Edit Profil & Avatar Hunter"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                    <span>Edit Profil</span>
                  </button>

                  <button
                    onClick={() => toggleUserActive(u.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      u.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/30 hover:bg-slate-500/20'
                    }`}
                  >
                    {u.isActive ? '✓ Aktif' : 'Diarsipkan'}
                  </button>

                  <button
                    id={`delete-user-${u.id}`}
                    onClick={() => setUserToDelete(u)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="Hapus Akun Hunter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SYSTEM, TIMEZONE & BACKUP */}
      {/* ========================================================================= */}
      {activeSubNav === 'system' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="border-b border-theme pb-4">
            <h3 className="font-black text-base text-theme">SISTEM, TIMEZONE WITA & BACKUP DATA</h3>
            <p className="text-xs text-theme-muted">
              Pengaturan zona waktu resmi WITA (Asia/Makassar) serta export dan import data cadangan.
            </p>
          </div>

          {/* Timezone Status Card */}
          <div className="p-4 rounded-xl bg-surface-alt border border-theme flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-theme">Zona Waktu Resmi Operasional</span>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                Asia/Makassar (WITA • UTC+8)
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Reset harian 00:00 WITA & mingguan Senin 00:00 WITA.
              </p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Phase 2: Firebase Foundation Diagnostic Card */}
          {(() => {
            const fbStatus = getFirebaseStatus();
            return (
              <div className="p-4 rounded-xl bg-surface-alt border border-theme space-y-2">
                               <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-theme uppercase tracking-wider">
                    Status Fondasi Infrastruktur (Phase 2)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                    fbStatus.useFirebaseFlag
                      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                  }`}>
                    Active: {fbStatus.useFirebaseFlag ? 'Cloud Firestore' : 'LocalStorage'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-surface border border-theme">
                    <span className="text-[10px] text-theme-muted block">Active Source of Truth</span>
                    <span className={`font-bold ${fbStatus.useFirebaseFlag ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {fbStatus.useFirebaseFlag ? 'Cloud Firestore' : 'Browser LocalStorage'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-theme">
                    <span className="text-[10px] text-theme-muted block">Firebase SDK</span>
                    <span className={`font-bold ${fbStatus.appInitialized ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {fbStatus.appInitialized ? 'Initialized' : 'Standby (Local)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-theme">
                    <span className="text-[10px] text-theme-muted block">Firestore Engine</span>
                    <span className={`font-bold ${fbStatus.firestoreInitialized ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {fbStatus.firestoreInitialized ? 'Ready' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-theme">
                    <span className="text-[10px] text-theme-muted block">Remote Flag</span>
                    <span className="font-mono font-bold text-theme">
                      VITE_USE_FIREBASE={fbStatus.useFirebaseFlag ? 'true' : 'false'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-theme-muted pt-1">
                  Seluruh data operasional, customer index, leads, order closing, cosmetic forge, dan akun hunter saat ini 100% aman beroperasi pada LocalStorage lokal. Fondasi Firebase SDK siap untuk tahap migrasi berikutnya.
                </p>
              </div>
            );
          })()}

          {/* Export / Import */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-theme">Export Backup JSON</h4>
                <p className="text-xs text-theme-muted mt-1">
                  Unduh seluruh database (Leads, Orders, Hunter Stats, Bounties, Level Tiers, Cosmetics) ke file JSON.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Backup (.json)</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-theme">Restore / Import JSON</h4>
                <p className="text-xs text-theme-muted mt-1">
                  Pulihkan seluruh data konfigurasi dari file backup JSON sebelumnya.
                </p>
              </div>
              <label className="mt-4 px-4 py-2 rounded-xl bg-surface border border-theme hover:bg-surface-alt text-theme font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Pilih File Backup JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          {/* Database Reset Management */}
          <div className="pt-5 border-t border-theme space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-theme">
              Manajemen Reset & Pembersihan Data
            </h4>

            {/* 1. Reset Operational Data (Safe for Master/Config/Forge) */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-theme">Reset Data Operasional</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Aman untuk Item Tempaan & Config
                  </span>
                </div>
                <p className="text-[11px] text-theme-muted leading-relaxed max-w-2xl">
                  Bersihkan data transaksi (pelanggan, leads, pesanan, riwayat aktivitas, claim bounty, dan progres hunter) agar dashboard siap untuk operasional baru. Seluruh Akun Hunter/Admin, Kosmetik Tempaan (Forge), Tema Kustom, dan Konfigurasi Quest tetap AMAN dan TIDAK AKAN DIHAPUS.
                </p>
              </div>
              <button
                type="button"
                id="open-reset-operational-modal-btn"
                onClick={() => setIsResetOperationalModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-all"
              >
                <Eraser className="w-4 h-4" />
                <span>Reset Data Operasional</span>
              </button>
            </div>

            {/* 2. Factory Reset (Complete Wiping to Initial Seed) */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-bold text-rose-500">Factory Reset (Kembali ke Seed Awal)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    Destruktif Total
                  </span>
                </div>
                <p className="text-[11px] text-theme-muted leading-relaxed max-w-2xl">
                  Mengembalikan seluruh database dan konfigurasi ke seed awal bawaan. Semua item kosmetik hasil tempaan kustom (Forge), tema buatan, akun hunter baru, dan perubahan master bounty AKAN DIHAPUS SECARA PERMANEN.
                </p>
              </div>
              <button
                type="button"
                id="open-factory-reset-modal-btn"
                onClick={() => setIsFactoryResetModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Factory Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Bounty Form Modal (Create & Edit) */}
      <BountyFormModal
        isOpen={isBountyFormOpen}
        onClose={() => {
          setIsBountyFormOpen(false);
          setBountyToEdit(null);
        }}
        onSubmit={handleSaveBountyForm}
        bountyToEdit={bountyToEdit}
      />

      {/* 2. Delete Bounty Confirmation Modal */}
      <DeleteBountyModal
        bounty={bountyToDelete}
        isOpen={!!bountyToDelete}
        onClose={() => setBountyToDelete(null)}
        onConfirm={handleConfirmDeleteBounty}
        isDeleting={isDeletingBounty}
      />

      {/* 3. Forge Cosmetic Modal (Create & Edit) */}
      <ForgeCosmeticModal
        isOpen={isForgeModalOpen}
        onClose={() => {
          setIsForgeModalOpen(false);
          setCosmeticToEdit(null);
        }}
        onSubmit={handleSaveCosmeticForm}
        itemToEdit={cosmeticToEdit}
        defaultCategory={
          selectedCosmeticCategory === 'ALL' ? 'Profile Frame' : selectedCosmeticCategory
        }
      />

      {/* 4. Delete Cosmetic Confirmation Modal */}
      <DeleteCosmeticModal
        item={cosmeticToDelete}
        isOpen={!!cosmeticToDelete}
        onClose={() => setCosmeticToDelete(null)}
        onConfirm={handleConfirmDeleteCosmetic}
        isDeleting={isDeletingCosmetic}
      />

      {/* 5. Delete Hunter Modal (With Safe Data Guarantee) */}
      <DeleteHunterModal
        user={userToDelete}
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        isDeleting={isDeletingUser}
      />

      {/* 6. Edit Level Modal */}
      <EditLevelModal
        isOpen={isLevelModalOpen}
        onClose={() => {
          setIsLevelModalOpen(false);
          setLevelToEdit(null);
        }}
        onSave={handleSaveLevelTier}
        levelTier={levelToEdit}
        isNew={isNewLevelModal}
      />

      {/* 7. Edit Rank Modal */}
      <EditRankModal
        isOpen={isRankModalOpen}
        onClose={() => {
          setIsRankModalOpen(false);
          setRankToEdit(null);
        }}
        onSave={handleSaveRankTier}
        rankTier={rankToEdit}
      />

      {/* 8. Edit Base Reward Modal */}
      <EditBaseRewardModal
        isOpen={!!baseRewardKeyToEdit}
        onClose={() => setBaseRewardKeyToEdit(null)}
        onSave={handleSaveBaseReward}
        rewardKey={baseRewardKeyToEdit}
        config={actionXpConfig}
      />

      {/* 9. Create New User Modal */}
      {showNewUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowNewUserModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card-theme max-w-md w-full p-5 sm:p-6 bg-surface border border-theme shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-theme">
              <h4 className="font-extrabold text-sm text-theme">Tambah Akun Hunter Baru</h4>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="text-xs text-theme-muted hover:text-theme cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="cth. Ketut Arya"
                  value={newUserForm.displayName}
                  onChange={e => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="cth. ketut"
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme mb-1">Password Awal *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.passwordPlain}
                  onChange={e => setNewUserForm({ ...newUserForm, passwordPlain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme mb-1">Role Akun</label>
                <select
                  value={newUserForm.role}
                  onChange={e =>
                    setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
                >
                  <option value="HUNTER">Hunter (Operator Web Order)</option>
                  <option value="VIEWER">Viewer (Read-Only Observer)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-theme-muted hover:text-theme cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-theme-primary text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Hunter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Edit Hunter Profile Modal (for Admin & Guild Master) */}
      {editingHunterUser && (
        <EditProfileModal
          isOpen={!!editingHunterUser}
          targetUser={editingHunterUser}
          onClose={() => setEditingHunterUser(null)}
        />
      )}

      {/* 11. Reset Operational Data Modal */}
      <ResetOperationalModal
        isOpen={isResetOperationalModalOpen}
        onClose={() => setIsResetOperationalModalOpen(false)}
        onConfirm={() => {
          resetOperationalData();
          setFeedbackMsg({
            text: 'Data operasional (pelanggan, leads, orders, claim, progres) berhasil dibersihkan! Akun hunter, item tempaan, dan konfigurasi master tetap aman.',
            isError: false,
          });
        }}
      />

      {/* 12. Factory Reset Modal */}
      <FactoryResetModal
        isOpen={isFactoryResetModalOpen}
        onClose={() => setIsFactoryResetModalOpen(false)}
        onConfirm={() => {
          factoryReset();
          setFeedbackMsg({
            text: 'Factory Reset berhasil! Seluruh database dan konfigurasi telah dikembalikan ke kondisi seed awal.',
            isError: false,
          });
        }}
      />
    </div>
  );
};
