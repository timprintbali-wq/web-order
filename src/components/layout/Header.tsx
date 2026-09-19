import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Crown,
  Flame,
  Bell,
  Volume2,
  VolumeX,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  LogOut,
  X,
  Check,
  CheckCircle2,
  Award,
  Zap,
  Palette,
  ShieldCheck,
  User as UserIcon,
  Coins,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { HunterSelect } from '../common/HunterSelect';
import { ProfileTitleBadge } from '../common/ProfileTitleBadge';
import { BpcCoinIcon } from '../common/BpcCoinIcon';
import { EditProfileModal } from '../modals/EditProfileModal';
import { UserPen } from 'lucide-react';

interface HeaderProps {
  onOpenShop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShop }) => {
  const { currentUser, users, logout } = useAuth();
  const {
    selectedHunterId,
    setSelectedHunterId,
    currentHunterStat,
    levelTiers,
    rankTiers,
    cosmetics,
    notifications,
    markNotificationRead,
    clearNotifications,
  } = useData();
  const { currentTheme, themeId, soundMuted, toggleSound } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentTier = levelTiers.find(t => t.level === currentHunterStat.level) || levelTiers[0];
  const nextTier = levelTiers.find(t => t.level === currentHunterStat.level + 1);
  const currentRank = rankTiers.find(r => r.id === currentHunterStat.rankId) || rankTiers[0];

  const minXp = currentTier.minXp;
  const maxXp = nextTier ? nextTier.minXp : currentTier.maxXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentHunterStat.xp - minXp) / (maxXp - minXp)) * 100))
  );

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const equippedFrameItem = useMemo(() => {
    if (!currentUser.equippedFrame || currentUser.equippedFrame === 'frame_none') return null;
    return cosmetics.find(c => c.type === 'Profile Frame' && (c.id === currentUser.equippedFrame || c.name === currentUser.equippedFrame)) || null;
  }, [currentUser.equippedFrame, cosmetics]);

  const equippedTitleItem = useMemo(() => {
    if (!currentUser.equippedTitle || currentUser.equippedTitle.trim() === '' || currentUser.equippedTitle === 'none') {
      return null;
    }
    return (
      cosmetics.find(
        c => c.type === 'Profile Title' && (c.id === currentUser.equippedTitle || c.name === currentUser.equippedTitle)
      ) || null
    );
  }, [currentUser.equippedTitle, cosmetics]);

  const equippedBadgeItem = useMemo(() => {
    if (!currentUser.equippedBadge) return null;
    return cosmetics.find(c => c.type === 'Achievement Badge' && (c.id === currentUser.equippedBadge || c.name === currentUser.equippedBadge)) || null;
  }, [currentUser.equippedBadge, cosmetics]);

  const getAvatarFrameClass = () => {
    if (currentUser.equippedFrame === 'frame_gold') {
      return 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-surface shadow-md shadow-yellow-500/20';
    }
    if (currentUser.equippedFrame === 'frame_silver') {
      return 'ring-2 ring-slate-300 dark:ring-slate-500 ring-offset-2 ring-offset-surface shadow-md';
    }
    if (currentUser.equippedFrame === 'frame_cyber_ring') {
      return 'ring-2 ring-pink-500 ring-offset-2 ring-offset-surface shadow-lg shadow-pink-500/30';
    }
    return 'ring-1 ring-slate-200 dark:ring-slate-700';
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-surface border-b border-theme shadow-xs px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand Logo & Global Hunter Filter */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-lg sm:text-xl font-black shadow-lg shadow-orange-500/30 shrink-0 select-none">
              🏴‍☠️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-black text-sm sm:text-base lg:text-lg tracking-tight text-theme leading-none truncate">
                  BOUNTY HQ
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                  Web Order
                </span>
              </div>
              <p className="text-[11px] text-theme-muted mt-0.5 font-medium hidden sm:block truncate">
                Bali Printing Center • Operational Game HUD
              </p>
            </div>
          </div>

          <HunterSelect
            id="hunter-filter-select"
            selectedHunterId={selectedHunterId}
            onChange={setSelectedHunterId}
            users={users}
            labelPrefix="DATA:"
            className="hidden md:inline-block"
          />
        </div>

        {/* Right Side: Actions & Wide Profile HUD Card */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <HunterSelect
            id="hunter-filter-select-mobile"
            selectedHunterId={selectedHunterId}
            onChange={setSelectedHunterId}
            users={users}
            size="sm"
            allLabel="Semua"
            className="md:hidden"
          />

          {currentUser.role !== 'VIEWER' && (
            <button
              id="open-shop-btn"
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
              title="Wizard Merchant & Koleksi Kosmetik"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wizard Merchant</span>
            </button>
          )}

          <button
            id="toggle-sound-btn"
            onClick={toggleSound}
            className="p-2 rounded-2xl bg-surface-alt hover:bg-theme-muted/10 border border-theme text-theme-muted hover:text-theme transition-all cursor-pointer shrink-0"
            title={soundMuted ? 'Aktifkan Suara Gamifikasi' : 'Matikan Suara Gamifikasi'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          <div className="relative shrink-0" ref={notifMenuRef}>
            <button
              id="notif-bell-btn"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-2xl bg-surface-alt hover:bg-theme-muted/10 border border-theme text-theme-muted hover:text-theme transition-all cursor-pointer"
              title="Notifikasi Misi & Aktivitas"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div
                id="notification-dropdown"
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 card-theme p-3 z-50 shadow-2xl rounded-3xl border border-theme bg-surface animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-theme mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="font-black text-xs text-theme">Notifikasi Aktivitas</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] font-bold text-theme-muted hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-theme-muted text-center py-6">
                      Belum ada notifikasi baru. Siap berburu omset!
                    </p>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={`${n.id || 'notif'}_${idx}`}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-2xl text-xs border transition-all cursor-pointer ${
                          n.isRead
                            ? 'bg-surface-alt/50 border-theme text-theme-muted'
                            : 'bg-orange-500/5 border-orange-500/20 text-theme font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs">{n.title}</span>
                          <span className="text-[10px] text-theme-muted shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 opacity-90">{n.message}</p>
                        {(n.xpGain || n.bpcGain) && (
                          <div className="flex items-center gap-2 mt-1 font-bold text-[10px]">
                            {n.xpGain && <span className="text-indigo-500">+{n.xpGain} XP</span>}
                            {n.bpcGain && <span className="text-amber-500">+{n.bpcGain} BPC</span>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              id="user-profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-surface-alt hover:bg-theme-muted/10 border border-theme transition-all cursor-pointer select-none text-left w-auto md:min-w-[220px] lg:min-w-[250px] lg:w-[265px] ${
                showProfileMenu ? 'ring-2 ring-orange-500/40 border-orange-500' : ''
              }`}
              title="Klik untuk membuka Profil Operative & Koleksi"
            >
              <div className="relative shrink-0">
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.displayName}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ${getAvatarFrameClass()}`}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
              </div>

              <div className="hidden md:flex flex-col flex-1 min-w-0 pr-0.5">
                <div className="flex items-center justify-between gap-1 leading-none mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded tracking-wider leading-none shrink-0 ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          : currentUser.role === 'VIEWER'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                    <span className="text-[11px] font-black text-amber-500 truncate">
                      {currentRank.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-theme-muted transition-transform duration-200 shrink-0 ${
                      showProfileMenu ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-black text-theme leading-none mb-1">
                  <span className="text-slate-900 dark:text-white truncate font-bold text-xs">
                    {currentUser.displayName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] shrink-0 font-mono">
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <BpcCoinIcon size="xs" /> {formatNumber(currentHunterStat.bpcBalance)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono shrink-0">
                    L{currentHunterStat.level}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-theme-muted font-mono shrink-0">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <div className="flex md:hidden items-center gap-1.5">
                <div className="flex flex-col text-left min-w-0 max-w-[80px]">
                  <span className="text-xs font-black text-theme truncate leading-tight">
                    {currentUser.displayName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold leading-none flex items-center gap-0.5">
                    L{currentHunterStat.level} • <BpcCoinIcon size="xs" />{formatNumber(currentHunterStat.bpcBalance)}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-theme-muted transition-transform duration-200 shrink-0 ${
                    showProfileMenu ? 'rotate-180 text-orange-500' : ''
                  }`}
                />
              </div>
            </button>

            {showProfileMenu && (
              <div
                id="user-menu-dropdown"
                className="absolute right-0 top-full mt-2.5 w-[310px] sm:w-[360px] max-h-[calc(100vh-90px)] overflow-y-auto card-theme z-50 shadow-2xl rounded-3xl border-2 border-theme bg-surface animate-in fade-in slide-in-from-top-2 p-0 divide-y divide-theme"
              >
                <div className="p-4 sm:p-5 bg-gradient-to-b from-surface-alt/70 to-surface">
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="relative shrink-0">
                      <img
                        src={
                          currentUser.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={currentUser.displayName}
                        className={`w-14 h-14 rounded-2xl object-cover ${getAvatarFrameClass()}`}
                      />
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[9px] leading-none shadow">
                        L{currentHunterStat.level}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider ${
                              currentUser.role === 'ADMIN'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                : currentUser.role === 'VIEWER'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {currentUser.role}
                          </span>
                          <span className="text-[10px] font-bold text-theme-muted font-mono truncate">
                            @{currentUser.username}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowEditProfileModal(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Edit Nama, Avatar & Bio"
                        >
                          <UserPen className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-theme truncate leading-tight">
                        {currentUser.displayName}
                      </h3>
                      {currentUser.bio && (
                        <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-2 italic">
                          "{currentUser.bio}"
                        </p>
                      )}
                      <div className="mt-1">
                        {equippedTitleItem ? (
                          <ProfileTitleBadge
                            titleText={equippedTitleItem.name}
                            rarity={equippedTitleItem.rarity}
                            size="xs"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold text-theme-muted italic">
                            Belum Memasang Gelar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-surface border border-theme flex items-center justify-between mb-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-theme">{currentRank.name}</div>
                        <div className="text-[10px] text-theme-muted">{currentRank.perks}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-theme-muted text-[11px]">Level {currentHunterStat.level} Progression</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                        {formatNumber(currentHunterStat.xp)} / {formatNumber(maxXp)} XP
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-2xl bg-surface border border-theme">
                      <span className="text-[9px] uppercase font-black text-theme-muted block">BPC Coins</span>
                      <span className="text-xs font-black text-amber-500 font-mono flex items-center justify-center gap-1 mt-0.5">
                        <BpcCoinIcon size="xs" /> {formatNumber(currentHunterStat.bpcBalance)}
                      </span>
                    </div>
                    <div className="p-2 rounded-2xl bg-surface border border-theme">
                      <span className="text-[9px] uppercase font-black text-theme-muted block">Streak</span>
                      <span className="text-xs font-black text-orange-500 block mt-0.5">
                        🔥 {currentHunterStat.streak} Hari
                      </span>
                    </div>
                    <div className="p-2 rounded-2xl bg-surface border border-theme">
                      <span className="text-[9px] uppercase font-black text-theme-muted block">Shields</span>
                      <span className="text-xs font-black text-indigo-500 block mt-0.5">
                        🛡️ {currentHunterStat.streakShields || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-theme-muted tracking-wider">
                      MY COLLECTION
                    </span>
                    {currentUser.role !== 'VIEWER' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenShop();
                        }}
                        className="text-[11px] font-black text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buka Wizard Merchant</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-surface-alt border border-theme">
                      <div className="flex items-center gap-1.5 text-theme-muted text-[10px] font-black mb-1">
                        <Palette className="w-3 h-3 text-orange-500" />
                        <span>Equipped Theme</span>
                      </div>
                      <div className="font-bold text-theme text-[11px] truncate">
                        {currentTheme.name}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-surface-alt border border-theme">
                      <div className="flex items-center gap-1.5 text-theme-muted text-[10px] font-black mb-1">
                        <ShieldCheck className="w-3 h-3 text-indigo-500" />
                        <span>Equipped Frame</span>
                      </div>
                      <div className="font-bold text-theme text-[11px] truncate">
                        {equippedFrameItem?.name || 'Standard Frame'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-surface-alt border border-theme">
                      <div className="flex items-center gap-1.5 text-theme-muted text-[10px] font-black mb-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Equipped Title</span>
                      </div>
                      <div className="mt-0.5 truncate">
                        {equippedTitleItem ? (
                          <ProfileTitleBadge
                            titleText={equippedTitleItem.name}
                            rarity={equippedTitleItem.rarity}
                            size="xs"
                          />
                        ) : (
                          <span className="text-[11px] text-theme-muted font-medium italic">
                            Tidak ada gelar
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-surface-alt border border-theme">
                      <div className="flex items-center gap-1.5 text-theme-muted text-[10px] font-black mb-1">
                        <Award className="w-3 h-3 text-emerald-500" />
                        <span>Equipped Badge</span>
                      </div>
                      <div className="font-bold text-theme text-[11px] truncate">
                        {equippedBadgeItem?.name || 'First Blood'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-alt/50 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-theme-muted font-medium">
                    BPC Web Order HUD
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="px-3 py-1.5 rounded-xl bg-surface hover:bg-theme-muted/10 border border-theme text-theme font-bold text-xs cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-rose-500 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* Custom Logout Confirmation (window.confirm tidak jalan di sandbox preview) */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-theme bg-surface border-2 border-theme rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95"
          >
            <h3 className="text-base font-black text-theme mb-1.5">Yakin ingin logout?</h3>
            <p className="text-xs text-theme-muted mb-4">
              Anda perlu login kembali dengan username dan password untuk mengakses aplikasi ini lagi.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-surface-alt hover:bg-theme-muted/10 border border-theme text-theme font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};