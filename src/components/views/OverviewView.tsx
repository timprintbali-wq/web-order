import React from 'react';
import {
  Users,
  Percent,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  Globe,
  MessageSquare,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatNumber, formatPercent } from '../../utils/formatters';
import { Channel } from '../../types';

import { BpcCoinIcon } from '../common/BpcCoinIcon';

interface OverviewViewProps {
  onNavigateToLeads: () => void;
  onNavigateToBounties: () => void;
  onNavigateToHuntLog: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateToLeads,
  onNavigateToBounties,
  onNavigateToHuntLog,
}) => {
  const { currentUser } = useAuth();
  const {
    stats,
    currentHunterStat,
    selectedHunterId,
    activeBountyInstances,
    getBountyProgress,
    rankTiers,
    levelTiers,
    targetConfig,
  } = useData();

  // Monthly Omset Target from Guild Library settings (configurable, default Rp150 JT team / Rp50 JT per hunter)
  const teamMonthlyTarget = targetConfig?.monthlyTarget || 150000000;
  const targetOmset = selectedHunterId === 'ALL' ? teamMonthlyTarget : Math.round(teamMonthlyTarget / 3);
  const currentOmset = stats.omsetThisMonth;
  const targetPercent = targetOmset > 0 ? Math.min(100, Math.round((currentOmset / targetOmset) * 100)) : 0;

  const currentRank = rankTiers.find(r => r.id === currentHunterStat.rankId) || rankTiers[0];
  const currentTier = levelTiers.find(t => t.level === currentHunterStat.level) || levelTiers[0];

  const channelIcons: Record<Channel, React.ElementType> = {
    Website: Globe,
    WhatsApp: MessageSquare,
    Tokopedia: ShoppingBag,
    Shopee: ShoppingBag,
  };

  const channelColors: Record<Channel, string> = {
    Website: 'from-blue-500 to-indigo-600',
    WhatsApp: 'from-emerald-500 to-teal-600',
    Tokopedia: 'from-green-500 to-emerald-600',
    Shopee: 'from-orange-500 to-amber-600',
  };

  return (
    <div id="overview-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Follow-up Action Alert Banner */}
      {stats.followUpAlertCount > 0 && (
        <div
          id="followup-alert-banner"
          className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              ⚠️
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-theme leading-tight">
                {stats.followUpAlertCount} customer perlu di-follow-up.
              </h4>
              <p className="text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                Action required • Jangan biarkan prospek dingin
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToLeads}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
          >
            <span>Hunt Follow-up</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP 3 DOMINANT KPI CARDS (LEADS, CONVERSION RATE, OMSET) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase font-black text-theme-secondary tracking-wider">
            Performa Web Order ({selectedHunterId === 'ALL' ? 'Seluruh Team BPC' : currentUser.displayName})
          </h2>
          <button
            onClick={onNavigateToHuntLog}
            className="text-xs font-black text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+ Input Data di Hunt Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {/* 1. LEADS */}
          <div
            id="kpi-leads"
            className="card-theme p-6 border-b-4 border-b-indigo-500 relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                📈
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs font-mono">
                +{stats.leadsToday} Hari Ini
              </span>
            </div>
            <p className="text-theme-secondary text-xs font-black uppercase tracking-wider mb-1">
              Leads
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-theme tracking-tight">
              {formatNumber(stats.totalLeads)}
            </h2>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-4 pt-3 border-t border-theme font-medium">
              <span>Semua Jalur Channel</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Aktif Dipantau</span>
            </div>
          </div>

          {/* 2. CONVERSION RATE */}
          <div
            id="kpi-conversion"
            className="card-theme p-6 border-b-4 border-b-emerald-500 relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                ⚡
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs font-mono">
                {stats.totalOrders} Closing
              </span>
            </div>
            <p className="text-theme-secondary text-xs font-black uppercase tracking-wider mb-1">
              Conversion Rate
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-theme tracking-tight">
              {formatPercent(stats.conversionRate)}
            </h2>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-4 pt-3 border-t border-theme font-medium">
              <span>Rasio Order Sukses</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Valid Closing</span>
            </div>
          </div>

          {/* 3. OMSET */}
          <div
            id="kpi-omset"
            className="card-theme p-6 border-b-4 border-b-orange-500 relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-600 dark:text-orange-400 text-xl font-bold">
                💰
              </div>
              <span className="text-orange-500 font-black text-xs">
                Daily Record!
              </span>
            </div>
            <p className="text-theme-secondary text-xs font-black uppercase tracking-wider mb-1">
              Omset
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-theme tracking-tight truncate">
              {formatRupiah(stats.totalOmset)}
            </h2>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-4 pt-3 border-t border-theme font-medium">
              <span>Hari ini: <strong className="text-theme font-bold">{formatRupiah(stats.omsetToday, true)}</strong></span>
              <span className="text-orange-500 font-bold">Bulan ini: {formatRupiah(stats.omsetThisMonth, true)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress & Channel Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Target Bar & Channel Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Progress Card */}
          <div className="card-theme p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-theme">
                  TARGET OMSET BULAN INI
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-surface-alt text-theme-secondary border border-theme">
                  WITA TIME
                </span>
              </div>
              <div className="text-xs font-black font-mono text-theme">
                {formatRupiah(currentOmset, true)} / {formatRupiah(targetOmset, true)}
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-500 transition-all duration-700 rounded-full"
                style={{ width: `${targetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-theme-secondary mt-3 font-medium">
              <span>Pencapaian: <strong className="text-theme font-black">{targetPercent}%</strong></span>
              <span>Sisa Target: <strong className="text-orange-500 font-black">{formatRupiah(Math.max(0, targetOmset - currentOmset), true)}</strong></span>
            </div>
          </div>

          {/* PERFORMA CHANNEL */}
          <div className="card-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-sm text-theme uppercase tracking-tight">
                  PERFORMA CHANNEL
                </h3>
                <p className="text-xs text-theme-secondary">
                  Distribusi Leads, Closing, dan Omset per jalur pemesanan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['Website', 'WhatsApp', 'Tokopedia', 'Shopee'] as Channel[]).map(ch => {
                const data = stats.channelBreakdown[ch];
                const Icon = channelIcons[ch];
                const totalChannelOmsetPercent = stats.totalOmset > 0 ? (data.omset / stats.totalOmset) * 100 : 0;

                return (
                  <div
                    key={ch}
                    className="p-4 rounded-2xl bg-surface-alt border border-theme flex flex-col justify-between shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${channelColors[ch]} text-white shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-black text-xs text-theme">{ch}</span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatPercent(data.conversionRate)} Conv
                      </span>
                    </div>

                    <div className="space-y-1.5 my-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-theme-secondary font-semibold">Omset:</span>
                        <span className="font-black text-theme font-mono">{formatRupiah(data.omset)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-theme-secondary font-semibold">Leads / Orders:</span>
                        <span className="font-bold text-theme font-mono">
                          {data.leads} Leads / {data.orders} Order
                        </span>
                      </div>
                    </div>

                    {/* Mini bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1 border border-slate-300/40 dark:border-slate-600/40">
                      <div
                        className="h-full bg-orange-500 dark:bg-orange-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, totalChannelOmsetPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Bounties Preview & Personal Hunter Stats */}
        <div className="space-y-6">
          {/* Active Bounty Progress Widget */}
          <div className="card-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-theme">
                  ACTIVE BOUNTIES
                </span>
                <span className="text-xs animate-bounce">🎯</span>
              </div>
              {currentUser.role !== 'VIEWER' && (
                <button
                  onClick={onNavigateToBounties}
                  className="text-xs font-black text-orange-500 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {activeBountyInstances.slice(0, 3).map((instance, idx) => {
                const prog = getBountyProgress(instance);
                const isBossOrWeekly = instance.frequency === 'WEEKLY' || instance.templateId === 'bounty_boss_omset_weekend';

                if (isBossOrWeekly && idx === 0) {
                  return (
                    <div
                      key={instance.id}
                      className="p-5 rounded-2xl bg-slate-900 text-white border-2 border-indigo-500/80 shadow-lg shadow-indigo-500/20 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                          Weekly Bounty
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                          <span>+{instance.xpReward} XP</span>
                          <span>•</span>
                          <span>+{instance.bpcReward} BPC</span>
                        </div>
                      </div>

                      <h4 className="font-black text-sm mb-2 text-white">{instance.name}</h4>

                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500 rounded-full"
                          style={{ width: `${prog.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-200 font-mono">
                        <span>
                          {instance.targetType === 'OMSET'
                            ? `${formatRupiah(prog.current, true)} / ${formatRupiah(prog.target, true)}`
                            : `${prog.current} / ${prog.target}`}
                        </span>
                        <span className="font-black text-amber-400">{prog.percentage}%</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={instance.id}
                    className="p-4 rounded-2xl bg-surface-alt border border-theme flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-theme truncate max-w-[140px]">
                        {instance.name}
                      </span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {instance.frequency}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-600/40">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          prog.isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${prog.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-theme-secondary font-mono">
                        {instance.targetType === 'OMSET'
                          ? `${formatRupiah(prog.current, true)} / ${formatRupiah(prog.target, true)}`
                          : `${prog.current} / ${prog.target}`}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="text-indigo-600 dark:text-indigo-400">+{instance.xpReward} XP</span>
                        <span className="text-amber-500 font-black">+{instance.bpcReward} BPC</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Hunter Overview Card */}
          <div className="card-theme p-6">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl shadow-inner">
                ⚔️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-sm text-theme">{currentUser.displayName}</h4>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-black uppercase">
                    {currentRank.name}
                  </span>
                </div>
                <p className="text-xs text-theme-secondary font-medium mt-0.5">
                  {currentTier.title} • Division Operative
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme text-xs">
              <div className="p-3 rounded-2xl bg-surface-alt border border-theme">
                <span className="text-theme-secondary text-[10px] uppercase font-black block">Streak Aktif</span>
                <span className="font-black text-theme text-sm flex items-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {currentHunterStat.streak} Hari
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-alt border border-theme">
                <span className="text-theme-secondary text-[10px] uppercase font-black block">Saldo BPC</span>
                <span className="font-black text-amber-500 text-sm flex items-center gap-1 mt-0.5">
                  <BpcCoinIcon size="xs" /> {formatNumber(currentHunterStat.bpcBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
