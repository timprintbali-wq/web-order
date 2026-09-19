import React, { useState, useEffect } from 'react';
import {
  Award,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
  Crown,
  ChevronRight,
  History,
  Map,
  Trophy,
  Skull,
  Lock,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  getDailyRemainingCountdown,
  getWeeklyRemainingCountdown,
  getMonthlyRemainingCountdown,
} from '../../utils/witaTime';
import { formatRupiah, formatNumber, formatPercent } from '../../utils/formatters';
import { BountyInstance } from '../../types';
import { ProfileTitleBadge } from '../common/ProfileTitleBadge';
import { BpcCoinIcon } from '../common/BpcCoinIcon';

export const BountyBoardView: React.FC = () => {
  const { currentUser, users } = useAuth();
  const {
    activeBountyInstances,
    bountyHistory,
    getBountyProgress,
    levelTiers,
    rankTiers,
    currentHunterStat,
    cosmetics,
  } = useData();

  // Sub-tabs: 'active' | 'map' | 'leaderboard' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'map' | 'leaderboard' | 'history'>(
    'active'
  );

  // Live WITA Countdowns
  const [dailyCountdown, setDailyCountdown] = useState<string>('');
  const [weeklyCountdown, setWeeklyCountdown] = useState<string>('');
  const [monthlyCountdown, setMonthlyCountdown] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      setDailyCountdown(getDailyRemainingCountdown());
      setWeeklyCountdown(getWeeklyRemainingCountdown());
      setMonthlyCountdown(getMonthlyRemainingCountdown());
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter instances by frequency / type
  const dailyBounties = activeBountyInstances.filter(
    b => b.frequency === 'DAILY' && b.rarity !== 'Boss'
  );
  const weeklyBounties = activeBountyInstances.filter(
    b => b.frequency === 'WEEKLY' && b.rarity !== 'Boss'
  );
  const monthlyBounties = activeBountyInstances.filter(
    b => b.frequency === 'MONTHLY' && b.rarity !== 'Boss'
  );
  const bossBounties = activeBountyInstances.filter(b => b.rarity === 'Boss' || b.frequency === 'BOSS');

  const renderBountyCard = (instance: BountyInstance) => {
    const prog = getBountyProgress(instance);
    const isBoss = instance.rarity === 'Boss' || instance.frequency === 'BOSS';
    const isTeam = instance.bountyMode === 'TEAM';
    const topHunter = isTeam && prog.topContributorId ? users.find(u => u.id === prog.topContributorId) : null;

    return (
      <div
        key={instance.id}
        className={`card-theme p-5 flex flex-col justify-between relative overflow-hidden transition-all border-2 ${
          prog.isCompleted
            ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
            : isBoss
            ? 'border-rose-500/80 bg-gradient-to-br from-surface via-surface to-rose-500/10 shadow-lg'
            : isTeam
            ? 'border-indigo-500/60 bg-gradient-to-br from-surface via-surface to-indigo-500/5 shadow-sm'
            : 'border-theme hover:border-theme-highlight'
        }`}
      >
        {isBoss && (
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/15 rounded-full blur-xl pointer-events-none" />
        )}

        <div>
          {/* Header pill & status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                  isBoss
                    ? 'bg-rose-500 text-white'
                    : instance.frequency === 'DAILY'
                    ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                    : instance.frequency === 'WEEKLY'
                    ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}
              >
                {isBoss ? '🔥 BOSS BOUNTY' : instance.frequency}
              </span>

              {/* Mode Badge: SOLO vs TEAM */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isTeam
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                }`}
              >
                {isTeam ? '👥 Team Quest' : '👤 Solo'}
              </span>

              {isTeam && (
                <span className="text-[9px] font-mono text-theme-muted">
                  {instance.teamRewardMode === 'TOP_CONTRIBUTOR'
                    ? '🏆 MVP'
                    : instance.teamRewardMode === 'PROPORTIONAL'
                    ? '📊 Share %'
                    : '🤝 Equal'}
                </span>
              )}
            </div>

            {prog.isCompleted ? (
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> ✓ COMPLETED
              </span>
            ) : (
              <span className="text-[11px] font-bold text-theme-secondary font-mono">
                {prog.percentage}%
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-sm sm:text-base text-theme flex items-center gap-1.5">
            {isBoss && <Skull className="w-4 h-4 text-rose-500 shrink-0" />}
            <span>{instance.name}</span>
          </h3>

          <p className="text-xs text-theme-secondary mt-1 leading-relaxed">{instance.description}</p>
        </div>

        {/* Progress bar & Target */}
        <div className="mt-4 pt-3 border-t border-theme">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-theme-secondary text-[11px] font-bold">
              {isTeam ? 'Progress Tim Kolektif' : 'Progress Anda'}
            </span>
            <span className="font-mono font-black text-theme">
              {instance.targetType === 'OMSET'
                ? `${formatRupiah(prog.current, true)} / ${formatRupiah(prog.target, true)}`
                : `${prog.current} / ${prog.target}`}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                prog.isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : isBoss
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : isTeam
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-gradient-to-r from-sky-400 to-theme-primary'
              }`}
              style={{ width: `${prog.percentage}%` }}
            />
          </div>

          {/* Team Contribution Summary if TEAM */}
          {isTeam && (
            <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-surface-alt/60 border border-theme/60 flex items-center justify-between text-[11px]">
              <span className="text-theme-muted font-medium">
                Kontribusi Anda: <strong className="text-theme font-mono font-bold">{prog.userContribution || 0}</strong>
              </span>
              {topHunter && (
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  👑 MVP: {topHunter.displayName}
                </span>
              )}
            </div>
          )}

          {/* Rewards Pill */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-2 font-black">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">+{formatNumber(instance.xpReward)} XP</span>
              <span className="text-amber-500 font-mono flex items-center gap-1">
                <BpcCoinIcon size="xs" />+{formatNumber(instance.bpcReward)} BPC
              </span>
            </div>
            <span className="text-[10px] font-bold text-theme-secondary">
              {prog.isCompleted ? '✓ Hadiah Diklaim' : 'Selesaikan Target'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="bounty-board-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="card-theme p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-base sm:text-lg font-black text-theme">BOUNTY BOARD</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              WITA Reset System
            </span>
          </div>
          <p className="text-xs text-theme-secondary mt-0.5">
            Selesaikan misi operasional harian, mingguan, bulanan, dan kalahkan Boss Bounty!
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme hover:bg-surface-alt'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Misi Aktif ({activeBountyInstances.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'map'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme hover:bg-surface-alt'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Treasure Map</span>
          </button>

          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme hover:bg-surface-alt'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme hover:bg-surface-alt'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 1. ACTIVE BOUNTIES TAB */}
      {activeSubTab === 'active' && (
        <div className="space-y-6">
          {/* BOSS BOUNTY SECTION (Dominant highlight if exists) */}
          {bossBounties.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    BOSS BOUNTY — MISI EKSTREM
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-rose-500">
                  Target Kolosal Team
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bossBounties.map(renderBountyCard)}
              </div>
            </div>
          )}

          {/* DAILY BOUNTIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-theme">
                  DAILY BOUNTIES
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-500 font-mono font-bold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Reset WITA: {dailyCountdown}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dailyBounties.map(renderBountyCard)}
            </div>
          </div>

          {/* WEEKLY BOUNTIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-theme">
                  WEEKLY BOUNTIES
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-500 font-mono font-bold bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Reset Mingguan: {weeklyCountdown}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {weeklyBounties.map(renderBountyCard)}
            </div>
          </div>

          {/* MONTHLY BOUNTIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🗓️</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-theme">
                  MONTHLY BOUNTIES
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Reset Bulan: {monthlyCountdown}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {monthlyBounties.map(renderBountyCard)}
            </div>
          </div>
        </div>
      )}

      {/* 2. TREASURE MAP PROGRESSION (Roadmap Level 1 to Level 8) */}
      {activeSubTab === 'map' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-theme pb-4">
            <div>
              <h3 className="font-black text-base text-theme">PETA PERJALANAN HUNTER (TREASURE MAP)</h3>
              <p className="text-xs text-theme-muted">
                Tingkatkan Level dengan mengumpulkan XP dari Lead & Order untuk membuka gelar, bingkai, dan tema baru!
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl">
              <Crown className="w-4 h-4" />
              <span>Level Anda: Level {currentHunterStat.level}</span>
            </div>
          </div>

          {/* Vertical/Horizontal Roadmap Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {levelTiers.map(tier => {
              const isUnlocked = currentHunterStat.level >= tier.level;
              const isCurrent = currentHunterStat.level === tier.level;

              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-2xl flex flex-col justify-between border-2 transition-all relative ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : isUnlocked
                      ? 'border-emerald-500/50 bg-surface-alt'
                      : 'border-theme bg-surface/50 opacity-60'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Lokasi Sekarang
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-xl bg-surface border border-theme flex items-center justify-center font-black text-xs text-theme">
                        L{tier.level}
                      </span>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-theme-muted" />
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-theme">{tier.title}</h4>
                    <span className="text-[10px] font-mono text-sky-500 font-bold block mt-0.5">
                      {formatNumber(tier.minXp)} XP
                    </span>

                    <div className="mt-3 p-2.5 rounded-xl bg-surface border border-theme text-xs">
                      <div className="text-[10px] font-extrabold uppercase text-amber-500">
                        🎁 Unlock Hadiah:
                      </div>
                      <div className="font-bold text-theme text-[11px] mt-0.5">{tier.unlockName}</div>
                      <div className="text-[10px] text-theme-muted mt-0.5 leading-snug">
                        {tier.unlockDescription}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LEADERBOARD TAB */}
      {activeSubTab === 'leaderboard' && (
        <div className="card-theme p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-theme pb-4">
            <div>
              <h3 className="font-black text-base text-theme">LEADERBOARD HUNTER WEB ORDER BPC</h3>
              <p className="text-xs text-theme-muted">
                Peringkat prestasi tim berdasarkan XP, Omset closing, conversion rate, dan konsistensi streak.
              </p>
            </div>
            <span className="text-xs font-bold text-theme-muted">Musim Aktif Q1 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme bg-surface-alt/40 text-theme-muted font-bold text-[11px]">
                  <th className="p-3.5 text-center w-12">Rank</th>
                  <th className="p-3.5">Hunter Profile</th>
                  <th className="p-3.5">Level & Gelar</th>
                  <th className="p-3.5">Tier Rank</th>
                  <th className="p-3.5 text-center">Streak 🔥</th>
                  <th className="p-3.5 text-right">Total XP</th>
                  <th className="p-3.5 text-right">Saldo BPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {users.map((u, idx) => {
                  const stat = u.id === currentUser.id ? currentHunterStat : {
                    xp: 3200 - idx * 600,
                    level: 4 - idx,
                    streak: 8 - idx * 2,
                    bpcBalance: 450 - idx * 100,
                    rankId: idx === 0 ? 'diamond' : idx === 1 ? 'gold' : 'silver',
                  };
                  const rank = rankTiers.find(r => r.id === stat.rankId) || rankTiers[0];
                  const titleItem = u.equippedTitle && u.equippedTitle.trim() !== '' && u.equippedTitle !== 'none'
                    ? cosmetics.find(c => c.type === 'Profile Title' && (c.id === u.equippedTitle || c.name === u.equippedTitle))
                    : null;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-surface-alt/30 transition-colors ${
                        u.id === currentUser.id ? 'bg-primary/5 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center font-black text-sm">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.displayName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-theme"
                          />
                          <div>
                            <div className="font-extrabold text-theme flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {u.id === currentUser.id && (
                                <span className="text-[9px] bg-primary text-white px-1.5 py-0.2 rounded font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-theme-muted font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-theme mb-1">Level {stat.level}</div>
                        {titleItem ? (
                          <ProfileTitleBadge
                            titleText={titleItem.name}
                            rarity={titleItem.rarity}
                            size="xs"
                          />
                        ) : (
                          <span className="text-[10px] text-theme-muted font-medium italic">
                            Tidak ada gelar
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {rank.name}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-theme">
                        {stat.streak} Hari
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-sky-500">
                        {formatNumber(stat.xp)} XP
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-amber-500">
                        <div className="flex items-center justify-end gap-1">
                          <BpcCoinIcon size="xs" /> {formatNumber(stat.bpcBalance)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="card-theme p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-theme pb-3">
            <div>
              <h3 className="font-black text-sm text-theme">RIWAYAT BOUNTY & KLAIM REWARD</h3>
              <p className="text-xs text-theme-muted">
                Daftar misi yang telah berhasil diselesaikan beserta hadiah XP dan BPC
              </p>
            </div>
            <span className="text-xs font-bold text-theme-muted font-mono">
              Total Selesai: {bountyHistory.length} Misi
            </span>
          </div>

          {bountyHistory.length === 0 ? (
            <p className="text-xs text-theme-muted py-8 text-center">
              Belum ada riwayat bounty yang diselesaikan. Mulai capai target di Hunt Log!
            </p>
          ) : (
            <div className="space-y-2">
              {bountyHistory.map(bh => (
                <div
                  key={bh.id}
                  className="p-3 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-extrabold text-theme">{bh.name}</div>
                      <div className="text-[11px] text-theme-muted mt-0.5 font-mono">
                        {bh.periodLabel} • {bh.completedAt ? new Date(bh.completedAt).toLocaleString('id-ID') : 'Selesai'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono font-black text-xs">
                    <span className="text-sky-500">+{bh.xpAwarded} XP</span>
                    <span className="text-amber-500">+{bh.bpcAwarded} BPC</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
