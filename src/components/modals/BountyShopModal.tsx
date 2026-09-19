import React, { useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Check,
  Lock,
  Palette,
  Shield,
  Tag,
  History,
  X,
  AlertCircle,
  Gem,
  Compass,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { CosmeticItem, CosmeticType } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { getRarityConfig, RARITY_HIERARCHY } from '../../utils/rarityConfig';
import { ProfileTitleBadge } from '../common/ProfileTitleBadge';
import { BpcCoinIcon } from '../common/BpcCoinIcon';

interface BountyShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BountyShopModal: React.FC<BountyShopModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, equipUserCosmetic } = useAuth();
  const {
    cosmetics,
    currentHunterStat,
    purchaseCosmetic,
    bpcTransactions,
  } = useData();
  const { setTheme, themeId, saveCustomTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'shop' | 'inventory' | 'history'>('shop');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'rarity-desc' | 'rarity-asc' | 'price-asc' | 'price-desc'>('default');
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const cosmeticTypes: (CosmeticType | 'ALL')[] = [
    'ALL',
    'Theme',
    'Profile Frame',
    'Profile Title',
    'BPC Coin',
    'Achievement Badge',
  ];

  const filteredCosmetics = cosmetics.filter(item => {
    if (!item.isActive) return false;
    if (selectedTypeFilter !== 'ALL' && item.type !== selectedTypeFilter) return false;
    return true;
  });

  const sortedCosmetics = [...filteredCosmetics].sort((a, b) => {
    if (sortBy === 'rarity-asc') {
      const orderA = RARITY_HIERARCHY[a.rarity]?.order ?? 1;
      const orderB = RARITY_HIERARCHY[b.rarity]?.order ?? 1;
      if (orderA !== orderB) return orderA - orderB;
      return a.bpcPrice - b.bpcPrice;
    }
    if (sortBy === 'rarity-desc') {
      const orderA = RARITY_HIERARCHY[a.rarity]?.order ?? 1;
      const orderB = RARITY_HIERARCHY[b.rarity]?.order ?? 1;
      if (orderA !== orderB) return orderB - orderA;
      return b.bpcPrice - a.bpcPrice;
    }
    if (sortBy === 'price-asc') {
      if (a.bpcPrice !== b.bpcPrice) return a.bpcPrice - b.bpcPrice;
      const orderA = RARITY_HIERARCHY[a.rarity]?.order ?? 1;
      const orderB = RARITY_HIERARCHY[b.rarity]?.order ?? 1;
      return orderA - orderB;
    }
    if (sortBy === 'price-desc') {
      if (a.bpcPrice !== b.bpcPrice) return b.bpcPrice - a.bpcPrice;
      const orderA = RARITY_HIERARCHY[a.rarity]?.order ?? 1;
      const orderB = RARITY_HIERARCHY[b.rarity]?.order ?? 1;
      return orderB - orderA;
    }
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  const handleBuy = (item: CosmeticItem) => {
    setPurchaseMsg(null);
    const result = purchaseCosmetic(item.id);
    if (!result.success) {
      setPurchaseMsg({ text: result.error || 'Gagal membeli item.', isError: true });
    } else {
      if (item.type === 'Theme' && item.themeDefinition) {
        saveCustomTheme(item.themeDefinition);
      }
      setPurchaseMsg({
        text: `Berhasil membuka ${item.name}! Item telah ditambahkan ke koleksi Anda.`,
        isError: false,
      });
    }
  };

  const handleEquip = (item: CosmeticItem) => {
    if (item.type === 'Theme') {
      if (item.themeDefinition) {
        saveCustomTheme(item.themeDefinition);
      }
      const targetThemeId = item.assetUrl || item.themeDefinition?.id || item.id;
      setTheme(targetThemeId);
      equipUserCosmetic('Theme', targetThemeId);
    } else if (item.type === 'Profile Frame') {
      equipUserCosmetic('Profile Frame', item.id);
    } else if (item.type === 'Profile Title') {
      equipUserCosmetic('Profile Title', item.id);
    } else if (item.type === 'BPC Coin') {
      equipUserCosmetic('BPC Coin', item.id);
    } else if (item.type === 'Achievement Badge') {
      equipUserCosmetic('Achievement Badge', item.id);
    }
  };

  const handleUnequip = (item: CosmeticItem) => {
    if (item.type === 'Theme') {
      setTheme('vibrant');
      equipUserCosmetic('Theme', 'vibrant');
    } else if (item.type === 'Profile Frame') {
      equipUserCosmetic('Profile Frame', '');
    } else if (item.type === 'Profile Title') {
      equipUserCosmetic('Profile Title', '');
    } else if (item.type === 'BPC Coin') {
      equipUserCosmetic('BPC Coin', 'coin_gold');
    } else if (item.type === 'Achievement Badge') {
      equipUserCosmetic('Achievement Badge', '');
    }
  };

  const isEquipped = (item: CosmeticItem): boolean => {
    if (item.type === 'Theme') {
      const itemCanonical = (item.assetUrl || item.themeDefinition?.id || item.id || '').replace(/^theme_/, '');
      const currentCanonical = (themeId || '').replace(/^theme_/, '');
      const userCanonical = (currentUser.equippedTheme || '').replace(/^theme_/, '');
      return currentCanonical === itemCanonical || userCanonical === itemCanonical;
    }
    if (item.type === 'Profile Frame') {
      return !!currentUser.equippedFrame && currentUser.equippedFrame !== 'frame_none' && (currentUser.equippedFrame === item.id || currentUser.equippedFrame === item.assetUrl);
    }
    if (item.type === 'Profile Title') {
      if (!currentUser.equippedTitle || currentUser.equippedTitle.trim() === '' || currentUser.equippedTitle === 'none') {
        return false;
      }
      return currentUser.equippedTitle === item.id || currentUser.equippedTitle === item.name;
    }
    if (item.type === 'BPC Coin') {
      return (currentUser.equippedCoin || 'coin_gold') === item.id;
    }
    if (item.type === 'Achievement Badge') {
      return !!currentUser.equippedBadge && (currentUser.equippedBadge === item.id || currentUser.equippedBadge === item.name);
    }
    return false;
  };

  const isUnlocked = (item: CosmeticItem): boolean => {
    if (item.bpcPrice === 0) return true;
    if (currentHunterStat.unlockedCosmeticIds.includes(item.id)) return true;
    if (item.type === 'Theme' && (item.id === 'theme_sakura' || item.assetUrl === 'sakura' || item.name.toLowerCase().includes('sakura'))) return true;
    return false;
  };

  return (
    <div
      id="bounty-shop-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="bounty-shop-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-4xl w-full h-[90vh] max-h-[760px] flex flex-col bg-surface overflow-hidden shadow-2xl border border-theme"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 text-xl font-bold">
              🛍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-theme">
                  WIZARD MERCHANT & COSMETIC COLLECTION
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  Virtual Only
                </span>
              </div>
              <p className="text-xs text-theme-muted">
                Tukarkan Bounty Pearl Coin (BPC) untuk tema, bingkai profil, koin kustom, dan gelar eksklusif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Pill */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-xs">
              <BpcCoinIcon size="sm" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-theme-muted leading-none">Saldo BPC</div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono leading-none mt-0.5">
                  {formatNumber(currentHunterStat.bpcBalance)}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-theme flex flex-wrap items-center justify-between gap-3 bg-surface">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme hover:bg-surface-alt'
              }`}
            >
              Katalog Wizard Merchant
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme hover:bg-surface-alt'
              }`}
            >
              Koleksi Saya ({currentHunterStat.unlockedCosmeticIds.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme hover:bg-surface-alt'
              }`}
            >
              Riwayat BPC
            </button>
          </div>

          {activeTab === 'shop' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {cosmeticTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedTypeFilter === type
                        ? 'bg-surface-alt text-theme border border-theme-highlight'
                        : 'text-theme-muted hover:text-theme'
                    }`}
                  >
                    {type === 'ALL' ? 'Semua Kategori' : type}
                  </button>
                ))}
              </div>

              {/* Compact Sort Control */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-theme/60">
                <span className="text-[11px] font-bold text-theme-muted flex items-center gap-1 select-none">
                  <ArrowUpDown className="w-3 h-3 text-purple-500" />
                  <span className="hidden sm:inline">Urutkan:</span>
                </span>
                <select
                  id="wizard-merchant-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-surface-alt border border-theme text-theme focus:ring-1 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="default">Default / Rekomendasi</option>
                  <option value="rarity-desc">Rarity: Tertinggi → Terendah</option>
                  <option value="rarity-asc">Rarity: Terendah → Tertinggi</option>
                  <option value="price-asc">Harga: Termurah → Termahal</option>
                  <option value="price-desc">Harga: Termahal → Termurah</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {purchaseMsg && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              purchaseMsg.isError
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{purchaseMsg.text}</span>
            </div>
            <button onClick={() => setPurchaseMsg(null)} className="text-xs underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'shop' && (
            sortedCosmetics.length === 0 ? (
              <div className="py-12 text-center text-theme-muted text-xs">
                Tidak ada item yang sesuai dengan kategori filter di Wizard Merchant.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedCosmetics.map(item => {
                  const unlocked = isUnlocked(item);
                  const equipped = isEquipped(item);
                  const canAfford = currentHunterStat.bpcBalance >= item.bpcPrice;
                  const levelMet = currentHunterStat.level >= item.requiredLevel;

                  return (
                    <div
                      key={item.id}
                      className={`card-theme p-4 flex flex-col justify-between transition-all border ${
                        equipped
                          ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                          : unlocked
                          ? 'border-purple-500/30'
                          : 'border-theme'
                      }`}
                    >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            getRarityConfig(item.rarity).badgeClass
                          }`}
                        >
                          {getRarityConfig(item.rarity).label} • {item.type}
                        </span>

                        {equipped ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3" /> Dipakai
                          </span>
                        ) : unlocked ? (
                          <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            Dimiliki
                          </span>
                        ) : null}
                      </div>

                      {/* Preview Asset / Visual */}
                      <div className="h-28 rounded-xl bg-surface-alt flex items-center justify-center mb-3 overflow-hidden border border-theme relative p-2">
                        {item.type === 'Theme' ? (
                          <div className="w-full h-full p-2.5 flex flex-col justify-between items-center rounded-lg bg-surface border border-theme/60">
                            <div className="flex items-center gap-1.5 w-full justify-between">
                              <span className="text-[10px] font-bold text-theme flex items-center gap-1">
                                <Palette className="w-3.5 h-3.5 text-theme-primary" />
                                {item.themeDefinition?.isDark ? 'Dark Theme' : 'Light Theme'}
                              </span>
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                                  style={{
                                    backgroundColor:
                                      item.themeDefinition?.colors.primary || '#f97316',
                                  }}
                                  title="Primary"
                                />
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                                  style={{
                                    backgroundColor:
                                      item.themeDefinition?.colors.secondary || '#6366f1',
                                  }}
                                  title="Secondary"
                                />
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                                  style={{
                                    backgroundColor:
                                      item.themeDefinition?.colors.bg || '#f8fafc',
                                  }}
                                  title="Background"
                                />
                              </div>
                            </div>
                            <div className="w-full p-1.5 rounded-md border border-theme text-center bg-surface-alt">
                              <span className="text-[11px] font-black text-theme truncate block">
                                {item.name}
                              </span>
                            </div>
                          </div>
                        ) : item.type === 'Profile Frame' ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative">
                              <img
                                src={currentUser.avatarUrl}
                                alt="Sample"
                                className={`w-12 h-12 rounded-full object-cover ${item.assetUrl}`}
                              />
                            </div>
                            <span className="text-[10px] text-theme-muted mt-1 font-mono">
                              Preview Avatar
                            </span>
                          </div>
                        ) : item.type === 'Profile Title' ? (
                          <div className="text-center p-2 flex flex-col items-center justify-center gap-1">
                            <ProfileTitleBadge
                              titleText={item.name}
                              rarity={item.rarity}
                              size="sm"
                            />
                          </div>
                        ) : item.type === 'BPC Coin' ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <BpcCoinIcon coinId={item.id} size="xl" />
                            <span className="text-[10px] text-theme-muted font-mono">{item.name}</span>
                          </div>
                        ) : (
                          <div className="text-3xl">{item.assetUrl}</div>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-theme">{item.name}</h4>
                      <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-theme-muted mt-2 font-medium">
                        Syarat: <span className="font-bold text-theme">{item.unlockRequirement}</span>
                      </div>
                    </div>

                    {/* Bottom Action / Price */}
                    <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono font-black text-xs text-amber-500">
                        <BpcCoinIcon size="xs" />
                        <span>{item.bpcPrice === 0 ? 'Gratis' : `${formatNumber(item.bpcPrice)} BPC`}</span>
                      </div>

                      {equipped ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Dipakai
                          </span>
                          <button
                            onClick={() => handleUnequip(item)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-alt hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 border border-theme hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Lepas / Nonaktifkan Kosmetik"
                          >
                            Lepas
                          </button>
                        </div>
                      ) : unlocked ? (
                        <button
                          onClick={() => handleEquip(item)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-theme-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-xs"
                        >
                          Pakai
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || !levelMet}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                            !levelMet
                              ? 'bg-surface-alt text-theme-muted cursor-not-allowed border border-theme'
                              : canAfford
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              : 'bg-surface-alt text-theme-muted border border-theme cursor-not-allowed'
                          }`}
                        >
                          {!levelMet ? (
                            <>
                              <Lock className="w-3 h-3" /> Lvl {item.requiredLevel}
                            </>
                          ) : canAfford ? (
                            'Buka Item'
                          ) : (
                            'BPC Kurang'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-theme">
                  Koleksi Kosmetik Terbuka ({currentHunterStat.unlockedCosmeticIds.length})
                </h3>
                <p className="text-xs text-theme-muted">Klik "Gunakan" untuk mengaktifkan atau "Lepas" untuk menonaktifkan</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cosmetics
                  .filter(c => currentHunterStat.unlockedCosmeticIds.includes(c.id))
                  .map(item => {
                    const equipped = isEquipped(item);

                    return (
                      <div
                        key={item.id}
                        className={`card-theme p-4 flex flex-col justify-between border ${
                          equipped ? 'border-emerald-500 shadow-sm' : 'border-theme'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                getRarityConfig(item.rarity).badgeClass
                              }`}
                            >
                              {getRarityConfig(item.rarity).label} • {item.type}
                            </span>
                            {equipped && (
                              <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3" /> Sedang Dipakai
                              </span>
                            )}
                          </div>

                          {/* Inventory Item Preview */}
                          <div className="h-20 rounded-xl bg-surface-alt flex items-center justify-center my-2 overflow-hidden border border-theme relative p-2">
                            {item.type === 'Profile Title' ? (
                              <ProfileTitleBadge
                                titleText={item.name}
                                rarity={item.rarity}
                                size="xs"
                              />
                            ) : item.type === 'Theme' ? (
                              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface border border-theme">
                                <Palette className="w-4 h-4 text-theme-primary" />
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
                                </div>
                                <span className="text-xs font-bold text-theme truncate max-w-[100px]">
                                  {item.name}
                                </span>
                              </div>
                            ) : item.type === 'BPC Coin' ? (
                              <div className="flex items-center gap-2">
                                <BpcCoinIcon coinId={item.id} size="lg" />
                                <span className="text-xs font-bold text-theme">{item.name}</span>
                              </div>
                            ) : item.type === 'Profile Frame' ? (
                              <div className="relative">
                                <img
                                  src={currentUser.avatarUrl}
                                  alt="Preview"
                                  className={`w-10 h-10 rounded-full object-cover ${item.assetUrl}`}
                                />
                              </div>
                            ) : (
                              <div className="text-2xl">{item.assetUrl || '✨'}</div>
                            )}
                          </div>

                          <h4 className="font-extrabold text-sm text-theme">{item.name}</h4>
                          <p className="text-xs text-theme-muted mt-1 leading-relaxed">{item.description}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-theme flex items-center justify-end gap-2">
                          {equipped ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Aktif
                              </span>
                              <button
                                onClick={() => handleUnequip(item)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-surface-alt hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 border border-theme hover:border-rose-500/30 transition-all cursor-pointer"
                              >
                                Lepas
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEquip(item)}
                              className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-theme-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-xs"
                            >
                              Gunakan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-theme mb-2">
                Riwayat Transaksi Bounty Pearl Coin (BPC)
              </h3>

              {bpcTransactions.length === 0 ? (
                <p className="text-xs text-theme-muted py-8 text-center">
                  Belum ada transaksi BPC tercatat. Selesaikan Bounty untuk menghasilkan BPC!
                </p>
              ) : (
                <div className="space-y-2">
                  {bpcTransactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-surface-alt border border-theme flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-theme">{tx.source}</div>
                        <div className="text-[11px] text-theme-muted mt-0.5">
                          {new Date(tx.timestamp).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div
                        className={`font-mono font-black text-sm ${
                          tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} BPC
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
