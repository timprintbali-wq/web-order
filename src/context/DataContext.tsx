import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Customer,
  Lead,
  Order,
  BountyTemplate,
  BountyInstance,
  BountyClaim,
  BountyHistoryItem,
  BountyMode,
  TeamRewardMode,
  BountyProgressResult,
  LevelTier,
  RankTier,
  Achievement,
  CosmeticItem,
  AssetItem,
  ActionXpConfig,
  HunterStats,
  TargetConfig,
  BPCTransaction,
  NotificationItem,
  Channel,
  LeadStatus,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_LEADS,
  INITIAL_ORDERS,
  INITIAL_BOUNTY_TEMPLATES,
  INITIAL_LEVEL_TIERS,
  INITIAL_RANK_TIERS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_COSMETICS,
  INITIAL_ASSETS,
  INITIAL_ACTION_XP,
  INITIAL_TARGET_CONFIG,
  INITIAL_HUNTER_STATS,
} from '../data/initialData';
import { PRESET_THEMES, ThemeDefinition } from '../types/theme';
import {
  getWitaDate,
  getWitaDateString,
  getWitaWeekKey,
  getWitaMonthKey,
  formatWitaDateTime,
} from '../utils/witaTime';
import { soundEffects } from '../utils/soundEffects';
import { useAuth } from './AuthContext';
import { getFirebaseStatus } from '../lib/firebase';
import {
  loadCloudState,
  saveCloudState,
  subscribeToCollection,
  upsertDoc,
  deleteDocById,
  clearCollectionDocs,
  replaceCollectionDocs,
} from '../lib/firestoreSync';

// Nama collection Firestore untuk data per-dokumen (customers/leads/orders).
// Berbeda dari STORAGE_KEYS (yang dipakai untuk localStorage & data lain yang
// masih disimpan sebagai 1 dokumen besar).
const CLOUD_COLLECTIONS = {
  CUSTOMERS: 'customers',
  LEADS: 'leads',
  ORDERS: 'orders',
};

const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const reconcileUnifiedCosmetics = (savedCosmeticsRaw: string | null): CosmeticItem[] => {
  let list: CosmeticItem[] = [];
  try {
    if (savedCosmeticsRaw) {
      const parsed = JSON.parse(savedCosmeticsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved cosmetics:', e);
  }

  if (list.length === 0) {
    list = [...INITIAL_COSMETICS];
  }

  const presetThemes = INITIAL_COSMETICS.filter(c => c.type === 'Theme');
  for (const preset of presetThemes) {
    const existingIndex = list.findIndex(
      c => c.id === preset.id || c.assetUrl === preset.assetUrl || c.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...preset,
        ...list[existingIndex],
        themeDefinition: list[existingIndex].themeDefinition || preset.themeDefinition,
        isActive: true,
      };
    } else {
      list.push(preset);
    }
  }

  for (const initItem of INITIAL_COSMETICS) {
    if (initItem.type !== 'Theme') {
      const exists = list.some(c => c.id === initItem.id);
      if (!exists) {
        list.push(initItem);
      }
    }
  }

  try {
    const customThemesRaw = localStorage.getItem('bpc_bounty_custom_themes');
    if (customThemesRaw) {
      const customThemes: Record<string, ThemeDefinition> = JSON.parse(customThemesRaw);
      for (const [themeKey, def] of Object.entries(customThemes)) {
        if (!def || !def.id) continue;
        const canonicalId = def.id.startsWith('theme_') ? def.id : `theme_${def.id}`;
        const exists = list.some(c => c.id === def.id || c.id === canonicalId || c.assetUrl === def.id);
        if (!exists) {
          list.push({
            id: canonicalId,
            name: def.name || themeKey,
            description: def.description || 'Custom Theme Forge item',
            type: 'Theme',
            rarity: 'Epic',
            assetUrl: canonicalId,
            previewAssetUrl: '',
            bpcPrice: 0,
            unlockMethod: 'Level Unlock',
            unlockRequirement: 'Tempaan Guild Master',
            requiredLevel: 1,
            isActive: true,
            sortOrder: 50,
            themeDefinition: def,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (e) {
    console.error('Error syncing custom themes into cosmetics:', e);
  }

  try {
    const customThemesToStore: Record<string, ThemeDefinition> = {};
    const existingRaw = localStorage.getItem('bpc_bounty_custom_themes');
    if (existingRaw) {
      Object.assign(customThemesToStore, JSON.parse(existingRaw));
    }
    list.filter(c => c.type === 'Theme' && c.themeDefinition).forEach(c => {
      const def = c.themeDefinition!;
      const key = def.id.replace(/^theme_/, '');
      customThemesToStore[key] = def;
      customThemesToStore[def.id] = def;
    });
    localStorage.setItem('bpc_bounty_custom_themes', JSON.stringify(customThemesToStore));
  } catch (e) {
    console.error('Error syncing cosmetics themes to custom_themes:', e);
  }

  return list;
};

export interface DerivedBusinessStats {
  totalLeads: number;
  totalOrders: number;
  totalOmset: number;
  conversionRate: number;
  followUpAlertCount: number;
  omsetToday: number;
  omsetThisWeek: number;
  omsetThisMonth: number;
  leadsToday: number;
  channelBreakdown: Record<Channel, { leads: number; orders: number; omset: number; conversionRate: number }>;
  followUpsNeeded: Lead[];
  recentOrders: Order[];
}

export interface CelebrationEvent {
  type: 'BOUNTY_COMPLETE' | 'LEVEL_UP' | 'PERSONAL_RECORD' | 'ACHIEVEMENT';
  title: string;
  subtitle: string;
  xpGain?: number;
  bpcGain?: number;
  levelInfo?: LevelTier;
  achievementInfo?: Achievement;
  timestamp: number;
}

interface DataContextType {
  selectedHunterId: string;
  setSelectedHunterId: (id: string) => void;

  customers: Customer[];
  leads: Lead[];
  orders: Order[];
  stats: DerivedBusinessStats;

  addLead: (leadData: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    channel: Channel;
    product: string;
    status: LeadStatus;
    notes: string;
    hunterId: string;
  }) => { success: boolean; leadId: string };

  addCustomer: (customerData: {
    name: string;
    phone: string;
    email?: string;
    channel: Channel;
    notes?: string;
    assignedHunterId?: string;
  }) => { success: boolean; customer: Customer; isExisting?: boolean };

  deleteCustomer: (customerId: string) => { success: boolean };

  updateCustomer: (
    customerId: string,
    updates: {
      name?: string;
      phone?: string;
      email?: string;
      channel?: Channel;
      notes?: string;
      status?: import('../types').CustomerStatus;
      assignedHunterId?: string;
      newLeadStatus?: LeadStatus;
      newProduct?: string;
    }
  ) => { success: boolean };

  recordOrder: (orderData: {
    customerId: string;
    leadId?: string;
    customerName: string;
    customerPhone: string;
    channel: Channel;
    product: string;
    orderValue: number;
    hunterId: string;
    notes?: string;
  }) => { success: boolean; orderId: string };

  updateOrderRevenue: (orderId: string, newRevenue: number) => { success: boolean; error?: string };

  bountyTemplates: BountyTemplate[];
  activeBountyInstances: BountyInstance[];
  bountyHistory: BountyHistoryItem[];
  hunterStats: Record<string, HunterStats>;
  currentHunterStat: HunterStats;
  levelTiers: LevelTier[];
  rankTiers: RankTier[];
  achievements: Achievement[];
  cosmetics: CosmeticItem[];
  assets: AssetItem[];
  actionXpConfig: ActionXpConfig;
  targetConfig: TargetConfig;
  updateTargetConfig: (config: TargetConfig) => void;
  bpcTransactions: BPCTransaction[];
  notifications: NotificationItem[];
  activeCelebration: CelebrationEvent | null;
  dismissCelebration: () => void;

  getBountyProgress: (
    instance: BountyInstance,
    hunterId?: string,
    overrideOrders?: Order[],
    overrideLeads?: Lead[]
  ) => BountyProgressResult;

  purchaseCosmetic: (cosmeticId: string) => { success: boolean; error?: string };

  createBountyTemplate: (template: Omit<BountyTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBountyTemplate: (id: string, updates: Partial<BountyTemplate>) => void;
  duplicateBountyTemplate: (id: string) => void;
  toggleBountyTemplate: (id: string) => void;
  archiveBountyTemplate: (id: string) => void;
  deleteBountyTemplate: (id: string) => { success: boolean; error?: string };

  updateLevelTiers: (tiers: LevelTier[]) => void;
  updateRankTiers: (tiers: RankTier[]) => void;
  updateAchievements: (achievements: Achievement[]) => void;
  updateActionXpConfig: (config: ActionXpConfig) => void;

  addCosmeticItem: (item: Omit<CosmeticItem, 'id' | 'createdAt'>) => void;
  updateCosmeticItem: (id: string, updates: Partial<CosmeticItem>) => void;
  deleteCosmeticItem: (id: string) => void;
  addAssetItem: (asset: Omit<AssetItem, 'id' | 'createdAt'>) => void;
  deleteAssetItem: (id: string) => void;

  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  resetOperationalData: () => void;
  factoryReset: () => void;
  resetToDefaultData: () => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonData: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CUSTOMERS: 'bpc_bounty_customers_v1',
  LEADS: 'bpc_bounty_leads_v1',
  ORDERS: 'bpc_bounty_orders_v1',
  BOUNTY_TEMPLATES: 'bpc_bounty_templates_v1',
  BOUNTY_CLAIMS: 'bpc_bounty_claims_v1',
  BOUNTY_HISTORY: 'bpc_bounty_history_v1',
  HUNTER_STATS: 'bpc_bounty_hunter_stats_v1',
  LEVEL_TIERS: 'bpc_bounty_level_tiers_v1',
  RANK_TIERS: 'bpc_bounty_rank_tiers_v1',
  ACHIEVEMENTS: 'bpc_bounty_achievements_v1',
  COSMETICS: 'bpc_bounty_cosmetics_v1',
  ASSETS: 'bpc_bounty_assets_v1',
  XP_CONFIG: 'bpc_bounty_xp_config_v1',
  TARGET_CONFIG: 'bpc_bounty_target_config_v1',
  BPC_TRANSACTIONS: 'bpc_bounty_bpc_tx_v1',
  NOTIFICATIONS: 'bpc_bounty_notifications_v1',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, factoryResetUsers } = useAuth();
  const [selectedHunterId, setSelectedHunterId] = useState<string>('ALL');

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [bountyTemplates, setBountyTemplates] = useState<BountyTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOUNTY_TEMPLATES);
      return saved ? JSON.parse(saved) : INITIAL_BOUNTY_TEMPLATES;
    } catch {
      return INITIAL_BOUNTY_TEMPLATES;
    }
  });

  const [bountyClaims, setBountyClaims] = useState<BountyClaim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOUNTY_CLAIMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bountyHistory, setBountyHistory] = useState<BountyHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOUNTY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hunterStats, setHunterStats] = useState<Record<string, HunterStats>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HUNTER_STATS);
      return saved ? JSON.parse(saved) : INITIAL_HUNTER_STATS;
    } catch {
      return INITIAL_HUNTER_STATS;
    }
  });

  const [levelTiers, setLevelTiers] = useState<LevelTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEVEL_TIERS);
      return saved ? JSON.parse(saved) : INITIAL_LEVEL_TIERS;
    } catch {
      return INITIAL_LEVEL_TIERS;
    }
  });

  const [rankTiers, setRankTiers] = useState<RankTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RANK_TIERS);
      return saved ? JSON.parse(saved) : INITIAL_RANK_TIERS;
    } catch {
      return INITIAL_RANK_TIERS;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });

  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COSMETICS);
      return reconcileUnifiedCosmetics(saved);
    } catch {
      return reconcileUnifiedCosmetics(null);
    }
  });

  const [assets, setAssets] = useState<AssetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
      return saved ? JSON.parse(saved) : INITIAL_ASSETS;
    } catch {
      return INITIAL_ASSETS;
    }
  });

  const [actionXpConfig, setActionXpConfig] = useState<ActionXpConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.XP_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_ACTION_XP;
    } catch {
      return INITIAL_ACTION_XP;
    }
  });

  const [targetConfig, setTargetConfig] = useState<TargetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TARGET_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_TARGET_CONFIG;
    } catch {
      return INITIAL_TARGET_CONFIG;
    }
  });

  const [bpcTransactions, setBpcTransactions] = useState<BPCTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BPC_TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      return parsed.filter(item => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch {
      return [];
    }
  });

  const [activeCelebration, setActiveCelebration] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    const status = getFirebaseStatus();
    if (!status.useFirebaseFlag) return;

    (async () => {
      const [
        cBountyTemplates, cBountyClaims, cBountyHistory,
        cHunterStats, cLevelTiers, cRankTiers, cAchievements, cCosmetics, cAssets,
        cActionXpConfig, cTargetConfig, cBpcTransactions, cNotifications,
      ] = await Promise.all([
        loadCloudState<typeof bountyTemplates>(STORAGE_KEYS.BOUNTY_TEMPLATES),
        loadCloudState<typeof bountyClaims>(STORAGE_KEYS.BOUNTY_CLAIMS),
        loadCloudState<typeof bountyHistory>(STORAGE_KEYS.BOUNTY_HISTORY),
        loadCloudState<typeof hunterStats>(STORAGE_KEYS.HUNTER_STATS),
        loadCloudState<typeof levelTiers>(STORAGE_KEYS.LEVEL_TIERS),
        loadCloudState<typeof rankTiers>(STORAGE_KEYS.RANK_TIERS),
        loadCloudState<typeof achievements>(STORAGE_KEYS.ACHIEVEMENTS),
        loadCloudState<typeof cosmetics>(STORAGE_KEYS.COSMETICS),
        loadCloudState<typeof assets>(STORAGE_KEYS.ASSETS),
        loadCloudState<typeof actionXpConfig>(STORAGE_KEYS.XP_CONFIG),
        loadCloudState<typeof targetConfig>(STORAGE_KEYS.TARGET_CONFIG),
        loadCloudState<typeof bpcTransactions>(STORAGE_KEYS.BPC_TRANSACTIONS),
        loadCloudState<typeof notifications>(STORAGE_KEYS.NOTIFICATIONS),
      ]);

      if (cBountyTemplates) setBountyTemplates(cBountyTemplates);
      if (cBountyClaims) setBountyClaims(cBountyClaims);
      if (cBountyHistory) setBountyHistory(cBountyHistory);
      if (cHunterStats) setHunterStats(cHunterStats);
      if (cLevelTiers) setLevelTiers(cLevelTiers);
      if (cRankTiers) setRankTiers(cRankTiers);
      if (cAchievements) setAchievements(cAchievements);
      if (cCosmetics) setCosmetics(cCosmetics);
      if (cAssets) setAssets(cAssets);
      if (cActionXpConfig) setActionXpConfig(cActionXpConfig);
      if (cTargetConfig) setTargetConfig(cTargetConfig);
      if (cBpcTransactions) setBpcTransactions(cBpcTransactions);
      if (cNotifications) setNotifications(cNotifications);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time sync untuk customers/leads/orders: 1 dokumen Firestore per
  // item, dengan listener live (onSnapshot). Setiap perubahan di environment
  // manapun (Preview atau Published) langsung tercermin di sini tanpa
  // refresh, dan tanpa menimpa dokumen item lain. Ini menggantikan mekanisme
  // "ambil sekali di mount + simpan seluruh array" yang lama.
  useEffect(() => {
    const status = getFirebaseStatus();
    if (!status.useFirebaseFlag) return;

    const unsubCustomers = subscribeToCollection<Customer>(CLOUD_COLLECTIONS.CUSTOMERS, setCustomers);
    const unsubLeads = subscribeToCollection<Lead>(CLOUD_COLLECTIONS.LEADS, setLeads);
    const unsubOrders = subscribeToCollection<Order>(CLOUD_COLLECTIONS.ORDERS, setOrders);

    return () => {
      unsubCustomers();
      unsubLeads();
      unsubOrders();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage tetap dijaga sinkron sebagai cache lokal / fallback mode
  // non-Firebase — tapi TIDAK lagi menulis seluruh array ke satu dokumen
  // Firestore (itu yang dulu menyebabkan saling menimpa antar environment).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }, [leads]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOUNTY_TEMPLATES, JSON.stringify(bountyTemplates));
    saveCloudState(STORAGE_KEYS.BOUNTY_TEMPLATES, bountyTemplates);
  }, [bountyTemplates]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOUNTY_CLAIMS, JSON.stringify(bountyClaims));
    saveCloudState(STORAGE_KEYS.BOUNTY_CLAIMS, bountyClaims);
  }, [bountyClaims]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOUNTY_HISTORY, JSON.stringify(bountyHistory));
    saveCloudState(STORAGE_KEYS.BOUNTY_HISTORY, bountyHistory);
  }, [bountyHistory]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HUNTER_STATS, JSON.stringify(hunterStats));
    saveCloudState(STORAGE_KEYS.HUNTER_STATS, hunterStats);
  }, [hunterStats]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEVEL_TIERS, JSON.stringify(levelTiers));
    saveCloudState(STORAGE_KEYS.LEVEL_TIERS, levelTiers);
  }, [levelTiers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RANK_TIERS, JSON.stringify(rankTiers));
    saveCloudState(STORAGE_KEYS.RANK_TIERS, rankTiers);
  }, [rankTiers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    saveCloudState(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }, [achievements]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COSMETICS, JSON.stringify(cosmetics));
    saveCloudState(STORAGE_KEYS.COSMETICS, cosmetics);
  }, [cosmetics]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    saveCloudState(STORAGE_KEYS.ASSETS, assets);
  }, [assets]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.XP_CONFIG, JSON.stringify(actionXpConfig));
    saveCloudState(STORAGE_KEYS.XP_CONFIG, actionXpConfig);
  }, [actionXpConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARGET_CONFIG, JSON.stringify(targetConfig));
    saveCloudState(STORAGE_KEYS.TARGET_CONFIG, targetConfig);
  }, [targetConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BPC_TRANSACTIONS, JSON.stringify(bpcTransactions));
    saveCloudState(STORAGE_KEYS.BPC_TRANSACTIONS, bpcTransactions);
  }, [bpcTransactions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    saveCloudState(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  const currentHunterStat = useMemo<HunterStats>(() => {
    if (hunterStats[currentUser.id]) {
      return hunterStats[currentUser.id];
    }
    return {
      userId: currentUser.id,
      xp: 0,
      level: 1,
      rankId: 'bronze',
      streak: 1,
      streakShields: 0,
      lastActiveDateWita: getWitaDateString(),
      bpcBalance: 100,
      unlockedCosmeticIds: ['theme_fresh', 'title_lead_rookie', 'coin_gold'],
      unlockedAchievementIds: [],
      personalRecords: {
        highestDailyOmset: 0,
        highestConversionRate: 0,
        mostLeadsInOneDay: 0,
        longestStreak: 1,
        mostOrdersInOneDay: 0,
      },
    };
  }, [hunterStats, currentUser.id]);

  const stats = useMemo<DerivedBusinessStats>(() => {
    const todayWitaStr = getWitaDateString();
    const currentWeekKey = getWitaWeekKey();
    const currentMonthKey = getWitaMonthKey();

    const filteredLeads = selectedHunterId === 'ALL' ? leads : leads.filter(l => l.hunterId === selectedHunterId);
    const filteredOrders = selectedHunterId === 'ALL' ? orders : orders.filter(o => o.hunterId === selectedHunterId);

    const successfulOrders = filteredOrders.filter(o => o.status === 'SUCCESS');
    const totalLeads = filteredLeads.length;
    const totalOrders = successfulOrders.length;
    const totalOmset = successfulOrders.reduce((sum, o) => sum + o.orderValue, 0);

    const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;

    const omsetToday = successfulOrders
      .filter(o => getWitaDateString(new Date(o.orderDate)) === todayWitaStr)
      .reduce((sum, o) => sum + o.orderValue, 0);

    const omsetThisWeek = successfulOrders
      .filter(o => getWitaWeekKey(new Date(o.orderDate)) === currentWeekKey)
      .reduce((sum, o) => sum + o.orderValue, 0);

    const omsetThisMonth = successfulOrders
      .filter(o => getWitaMonthKey(new Date(o.orderDate)) === currentMonthKey)
      .reduce((sum, o) => sum + o.orderValue, 0);

    const leadsToday = filteredLeads.filter(
      l => getWitaDateString(new Date(l.createdAt)) === todayWitaStr
    ).length;

    const followUpsNeeded = filteredLeads.filter(l => l.status === 'Follow-up' || l.status === 'Quotation');

    const channels: Channel[] = ['Website', 'WhatsApp', 'Tokopedia', 'Shopee'];
    const channelBreakdown: Record<Channel, { leads: number; orders: number; omset: number; conversionRate: number }> = {
      Website: { leads: 0, orders: 0, omset: 0, conversionRate: 0 },
      WhatsApp: { leads: 0, orders: 0, omset: 0, conversionRate: 0 },
      Tokopedia: { leads: 0, orders: 0, omset: 0, conversionRate: 0 },
      Shopee: { leads: 0, orders: 0, omset: 0, conversionRate: 0 },
    };

    channels.forEach(ch => {
      const chLeads = filteredLeads.filter(l => l.channel === ch).length;
      const chOrders = successfulOrders.filter(o => o.channel === ch);
      const chOmset = chOrders.reduce((sum, o) => sum + o.orderValue, 0);
      const chConv = chLeads > 0 ? (chOrders.length / chLeads) * 100 : 0;
      channelBreakdown[ch] = {
        leads: chLeads,
        orders: chOrders.length,
        omset: chOmset,
        conversionRate: chConv,
      };
    });

    const recentOrders = [...successfulOrders].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );

    return {
      totalLeads,
      totalOrders,
      totalOmset,
      conversionRate,
      followUpAlertCount: followUpsNeeded.length,
      omsetToday,
      omsetThisWeek,
      omsetThisMonth,
      leadsToday,
      channelBreakdown,
      followUpsNeeded,
      recentOrders,
    };
  }, [leads, orders, selectedHunterId]);

  const activeBountyInstances = useMemo<BountyInstance[]>(() => {
    const todayStr = getWitaDateString();
    const weekKey = getWitaWeekKey();
    const monthKey = getWitaMonthKey();

    return bountyTemplates
      .filter(t => t.isActive)
      .map(t => {
        let periodKey = todayStr;
        let periodStart = todayStr + 'T00:00:00.000Z';
        let periodEnd = todayStr + 'T23:59:59.999Z';

        if (t.frequency === 'WEEKLY') {
          periodKey = weekKey;
        } else if (t.frequency === 'MONTHLY') {
          periodKey = monthKey;
        } else if (t.frequency === 'BOSS') {
          periodKey = 'BOSS-' + monthKey;
        }

        return {
          id: `${t.id}_${periodKey}`,
          templateId: t.id,
          name: t.name,
          description: t.description,
          frequency: t.frequency,
          rarity: t.rarity,
          targetType: t.targetType,
          targetValue: t.targetValue,
          channelScope: t.channelScope,
          hunterScope: t.hunterScope,
          bountyMode: t.bountyMode || 'SOLO',
          teamRewardMode: t.teamRewardMode || 'TOP_CONTRIBUTOR',
          periodKey,
          periodStart,
          periodEnd,
          xpReward: t.xpReward,
          bpcReward: t.bpcReward,
          iconName: t.iconName,
          isActive: t.isActive,
        };
      });
  }, [bountyTemplates]);

  const getBountyProgress = useCallback(
    (
      instance: BountyInstance,
      targetHunterId?: string,
      overrideOrders?: Order[],
      overrideLeads?: Lead[]
    ): BountyProgressResult => {
      const activeHunterId = targetHunterId || (selectedHunterId === 'ALL' ? currentUser.id : selectedHunterId);
      const effectiveLeads = overrideLeads || leads;
      const effectiveOrders = overrideOrders || orders;
      const mode = instance.bountyMode || 'SOLO';
      const rewardMode = instance.teamRewardMode || 'TOP_CONTRIBUTOR';

      const isDaily = instance.frequency === 'DAILY';
      const isWeekly = instance.frequency === 'WEEKLY';
      const isMonthly = instance.frequency === 'MONTHLY' || instance.frequency === 'BOSS';

      const matchPeriod = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isDaily) return getWitaDateString(d) === instance.periodKey;
        if (isWeekly) return getWitaWeekKey(d) === instance.periodKey;
        if (isMonthly) return getWitaMonthKey(d) === instance.periodKey.replace('BOSS-', '');
        return true;
      };

      if (mode === 'TEAM') {
        const allScopedLeads = effectiveLeads.filter(l => {
          if (instance.hunterScope !== 'ALL' && l.hunterId !== instance.hunterScope) return false;
          if (instance.channelScope !== 'ALL' && l.channel !== instance.channelScope) return false;
          return matchPeriod(l.createdAt);
        });

        const allScopedOrders = effectiveOrders.filter(o => {
          if (o.status !== 'SUCCESS') return false;
          if (instance.hunterScope !== 'ALL' && o.hunterId !== instance.hunterScope) return false;
          if (instance.channelScope !== 'ALL' && o.channel !== instance.channelScope) return false;
          return matchPeriod(o.orderDate);
        });

        let current = 0;
        const contributions: Record<string, number> = {};

        users.forEach(u => {
          contributions[u.id] = 0;
        });

        switch (instance.targetType) {
          case 'LEADS':
            current = allScopedLeads.length;
            allScopedLeads.forEach(l => {
              contributions[l.hunterId] = (contributions[l.hunterId] || 0) + 1;
            });
            break;
          case 'SUCCESSFUL_ORDERS':
            current = allScopedOrders.length;
            allScopedOrders.forEach(o => {
              contributions[o.hunterId] = (contributions[o.hunterId] || 0) + 1;
            });
            break;
          case 'OMSET':
            current = allScopedOrders.reduce((sum, o) => sum + o.orderValue, 0);
            allScopedOrders.forEach(o => {
              contributions[o.hunterId] = (contributions[o.hunterId] || 0) + o.orderValue;
            });
            break;
          case 'CONVERSION_RATE':
            current = allScopedLeads.length > 0 ? (allScopedOrders.length / allScopedLeads.length) * 100 : 0;
            allScopedOrders.forEach(o => {
              contributions[o.hunterId] = (contributions[o.hunterId] || 0) + 1;
            });
            break;
          case 'FOLLOW_UPS':
            const fLeads = allScopedLeads.filter(l => l.status === 'Follow-up' || l.status === 'Quotation');
            current = fLeads.length;
            fLeads.forEach(l => {
              contributions[l.hunterId] = (contributions[l.hunterId] || 0) + 1;
            });
            break;
          default:
            current = allScopedOrders.length;
            allScopedOrders.forEach(o => {
              contributions[o.hunterId] = (contributions[o.hunterId] || 0) + 1;
            });
        }

        let topContributorId: string | undefined = undefined;
        let highestContrib = -1;
        Object.entries(contributions).forEach(([hId, val]) => {
          if (val > highestContrib && val > 0) {
            highestContrib = val;
            topContributorId = hId;
          }
        });

        const target = instance.targetValue;
        const percentage = Math.min(100, Math.round((current / target) * 100));
        const isCompleted = current >= target;

        const teamClaimId = `${instance.periodKey}_TEAM_${instance.templateId}`;
        const isRewardClaimed = bountyClaims.some(
          c =>
            c.id === teamClaimId ||
            (c.userId === 'TEAM' && c.templateId === instance.templateId && c.periodKey === instance.periodKey) ||
            (c.templateId === instance.templateId && c.periodKey === instance.periodKey && c.bountyMode === 'TEAM')
        );

        return {
          current,
          target,
          percentage: isNaN(percentage) ? 0 : percentage,
          isCompleted,
          isRewardClaimed,
          bountyMode: 'TEAM',
          teamRewardMode: rewardMode,
          contributions,
          topContributorId,
          userContribution: contributions[currentUser.id] || 0,
        };
      } else {
        const scopedLeads = effectiveLeads.filter(l => {
          if (instance.hunterScope !== 'ALL' && l.hunterId !== instance.hunterScope) return false;
          if (instance.hunterScope === 'ALL' && activeHunterId && l.hunterId !== activeHunterId) return false;
          if (instance.channelScope !== 'ALL' && l.channel !== instance.channelScope) return false;
          return matchPeriod(l.createdAt);
        });

        const scopedOrders = effectiveOrders.filter(o => {
          if (o.status !== 'SUCCESS') return false;
          if (instance.hunterScope !== 'ALL' && o.hunterId !== instance.hunterScope) return false;
          if (instance.hunterScope === 'ALL' && activeHunterId && o.hunterId !== activeHunterId) return false;
          if (instance.channelScope !== 'ALL' && o.channel !== instance.channelScope) return false;
          return matchPeriod(o.orderDate);
        });

        let current = 0;
        switch (instance.targetType) {
          case 'LEADS':
            current = scopedLeads.length;
            break;
          case 'SUCCESSFUL_ORDERS':
            current = scopedOrders.length;
            break;
          case 'OMSET':
            current = scopedOrders.reduce((sum, o) => sum + o.orderValue, 0);
            break;
          case 'CONVERSION_RATE':
            current = scopedLeads.length > 0 ? (scopedOrders.length / scopedLeads.length) * 100 : 0;
            break;
          case 'FOLLOW_UPS':
            current = scopedLeads.filter(l => l.status === 'Follow-up' || l.status === 'Quotation').length;
            break;
          default:
            current = scopedOrders.length;
        }

        const target = instance.targetValue;
        const percentage = Math.min(100, Math.round((current / target) * 100));
        const isCompleted = current >= target;

        const soloClaimId = `${instance.periodKey}_${activeHunterId}_${instance.templateId}`;
        const legacyClaimId = `${activeHunterId}_${instance.id}`;
        const isRewardClaimed = bountyClaims.some(
          c =>
            c.id === soloClaimId ||
            c.id === legacyClaimId ||
            (c.userId === activeHunterId && c.templateId === instance.templateId && c.periodKey === instance.periodKey)
        );

        return {
          current,
          target,
          percentage: isNaN(percentage) ? 0 : percentage,
          isCompleted,
          isRewardClaimed,
          bountyMode: 'SOLO',
          teamRewardMode: rewardMode,
          contributions: { [activeHunterId]: current },
          userContribution: current,
        };
      }
    },
    [leads, orders, selectedHunterId, currentUser.id, users, bountyClaims]
  );

  const triggerCelebration = useCallback((event: CelebrationEvent) => {
    setActiveCelebration(event);
    if (typeof confetti === 'function') {
      confetti({
        particleCount: event.type === 'LEVEL_UP' ? 120 : 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#ffffff'],
      });
    }
  }, []);

  const dismissCelebration = () => {
    setActiveCelebration(null);
  };

  const awardHunterProgress = useCallback(
    (hunterId: string, xpDelta: number, bpcDelta: number = 0, reason: string = '') => {
      setHunterStats(prev => {
        const current = prev[hunterId] || {
          userId: hunterId,
          xp: 0,
          level: 1,
          rankId: 'bronze',
          streak: 1,
          streakShields: 0,
          lastActiveDateWita: getWitaDateString(),
          bpcBalance: 0,
          unlockedCosmeticIds: ['theme_fresh', 'title_lead_rookie', 'coin_gold'],
          unlockedAchievementIds: [],
          personalRecords: {
            highestDailyOmset: 0,
            highestConversionRate: 0,
            mostLeadsInOneDay: 0,
            longestStreak: 1,
            mostOrdersInOneDay: 0,
          },
        };

        const newXp = current.xp + xpDelta;
        const newBpc = current.bpcBalance + bpcDelta;

        let newLevel = current.level;
        for (let i = levelTiers.length - 1; i >= 0; i--) {
          if (newXp >= levelTiers[i].minXp) {
            newLevel = levelTiers[i].level;
            break;
          }
        }

        if (newLevel > current.level) {
          const tier = levelTiers.find(t => t.level === newLevel);
          soundEffects.playLevelUp();
          triggerCelebration({
            type: 'LEVEL_UP',
            title: `LEVEL UP! Level ${newLevel}`,
            subtitle: tier ? `${tier.title} — Unlocked: ${tier.unlockName}` : 'Naik ke level berikutnya!',
            levelInfo: tier,
            xpGain: xpDelta,
            bpcGain: tier?.bpcReward || 0,
            timestamp: Date.now(),
          });

          const levelDedup = `LEVEL_UP_${hunterId}_${newLevel}`;
          setNotifications(n => {
            if (n.some(item => item.dedupKey === levelDedup)) return n;
            return [
              {
                id: generateUniqueId('notif_lvl'),
                dedupKey: levelDedup,
                userId: hunterId,
                title: `🎉 LEVEL UP! Level ${newLevel}`,
                message: `Selamat! Anda meraih gelar ${tier?.title || ''}. ${tier?.unlockDescription || ''}`,
                type: 'LEVEL_UP',
                xpGain: xpDelta,
                bpcGain: tier?.bpcReward || 0,
                timestamp: new Date().toISOString(),
                isRead: false,
              },
              ...n,
            ];
          });
        }

        return {
          ...prev,
          [hunterId]: {
            ...current,
            xp: newXp,
            level: newLevel,
            bpcBalance: newBpc,
            lastActiveDateWita: getWitaDateString(),
          },
        };
      });

      if (bpcDelta !== 0) {
        setBpcTransactions(txs => [
          {
            id: generateUniqueId('tx'),
            userId: hunterId,
            amount: bpcDelta,
            type: bpcDelta > 0 ? 'EARN' : 'SPEND',
            source: reason || 'Progress XP & Mission',
            timestamp: new Date().toISOString(),
          },
          ...txs,
        ]);
        if (bpcDelta > 0) {
          soundEffects.playCoin();
        }
      }
    },
    [levelTiers, triggerCelebration]
  );

  const evaluateActiveBounties = useCallback(
    (targetHunterId?: string, overrideOrders?: Order[], overrideLeads?: Lead[]) => {
      const hunterId = targetHunterId || currentUser.id;
      const currentOrders = overrideOrders || orders;
      const currentLeads = overrideLeads || leads;

      activeBountyInstances.forEach(instance => {
        const prog = getBountyProgress(instance, hunterId, currentOrders, currentLeads);

        if (instance.bountyMode === 'TEAM') {
          const teamClaimId = `${instance.periodKey}_TEAM_${instance.templateId}`;
          const alreadyClaimed = bountyClaims.some(
            c =>
              c.id === teamClaimId ||
              (c.userId === 'TEAM' && c.templateId === instance.templateId && c.periodKey === instance.periodKey) ||
              (c.templateId === instance.templateId && c.periodKey === instance.periodKey && c.bountyMode === 'TEAM')
          );

          if (prog.isCompleted && !alreadyClaimed) {
            const topHunterId = prog.topContributorId || hunterId;
            const contributions = prog.contributions || {};

            const newClaim: BountyClaim = {
              id: teamClaimId,
              bountyInstanceId: instance.id,
              templateId: instance.templateId,
              userId: 'TEAM',
              periodKey: instance.periodKey,
              completedAt: new Date().toISOString(),
              xpAwarded: instance.xpReward,
              bpcAwarded: instance.bpcReward,
              rewardGranted: true,
              bountyMode: 'TEAM',
            };

            setBountyClaims(prev => (prev.some(c => c.id === teamClaimId) ? prev : [...prev, newClaim]));

            setBountyHistory(prev => [
              {
                id: generateUniqueId('hist_team'),
                bountyInstanceId: instance.id,
                templateId: instance.templateId,
                name: `[TEAM] ${instance.name}`,
                frequency: instance.frequency,
                rarity: instance.rarity,
                periodLabel: instance.periodKey,
                periodKey: instance.periodKey,
                targetValue: instance.targetValue,
                currentProgress: prog.current,
                isCompleted: true,
                completedAt: new Date().toISOString(),
                xpAwarded: instance.xpReward,
                bpcAwarded: instance.bpcReward,
                userId: 'TEAM',
              },
              ...prev,
            ]);

            if (instance.teamRewardMode === 'TOP_CONTRIBUTOR') {
              awardHunterProgress(
                topHunterId,
                instance.xpReward,
                instance.bpcReward,
                `Team Bounty MVP (${instance.name})`
              );
              const topHunter = users.find(u => u.id === topHunterId);
              const notifDedup = `BOUNTY_TEAM_TOP_${topHunterId}_${instance.periodKey}_${instance.templateId}`;
              setNotifications(prev => {
                if (prev.some(n => n.dedupKey === notifDedup)) return prev;
                return [
                  {
                    id: generateUniqueId('notif_bounty_team'),
                    dedupKey: notifDedup,
                    userId: topHunterId,
                    title: `🏆 TEAM BOUNTY MVP! ${instance.name}`,
                    message: `Misi Tim "${instance.name}" selesai! ${topHunter?.displayName || topHunterId} menjadi Top Contributor dan mendapatkan +${instance.xpReward} XP & +${instance.bpcReward} BPC!`,
                    type: 'BOUNTY',
                    xpGain: instance.xpReward,
                    bpcGain: instance.bpcReward,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                  },
                  ...prev,
                ];
              });
            } else if (instance.teamRewardMode === 'PROPORTIONAL') {
              (Object.entries(contributions) as [string, number][]).forEach(([hId, count]) => {
                if (count > 0) {
                  const fraction = count / (prog.current || 1);
                  const hXp = Math.max(1, Math.round(instance.xpReward * fraction));
                  const hBpc = Math.max(1, Math.round(instance.bpcReward * fraction));
                  awardHunterProgress(hId, hXp, hBpc, `Team Bounty Share (${instance.name})`);

                  const notifDedup = `BOUNTY_TEAM_PROP_${hId}_${instance.periodKey}_${instance.templateId}`;
                  setNotifications(prev => {
                    if (prev.some(n => n.dedupKey === notifDedup)) return prev;
                    return [
                      {
                        id: generateUniqueId('notif_bounty_team'),
                        dedupKey: notifDedup,
                        userId: hId,
                        title: `🤝 TEAM BOUNTY SELESAI! ${instance.name}`,
                        message: `Misi Tim selesai! Anda berkontribusi ${count} dan menerima bagian +${hXp} XP & +${hBpc} BPC!`,
                        type: 'BOUNTY',
                        xpGain: hXp,
                        bpcGain: hBpc,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                      },
                      ...prev,
                    ];
                  });
                }
              });
            } else {
              const activeContributors = (Object.entries(contributions) as [string, number][]).filter(([_, count]) => count > 0);
              const countContributors = activeContributors.length || 1;
              const hXp = Math.max(1, Math.round(instance.xpReward / countContributors));
              const hBpc = Math.max(1, Math.round(instance.bpcReward / countContributors));

              activeContributors.forEach(([hId]) => {
                awardHunterProgress(hId, hXp, hBpc, `Team Bounty Equal Share (${instance.name})`);

                const notifDedup = `BOUNTY_TEAM_EQ_${hId}_${instance.periodKey}_${instance.templateId}`;
                setNotifications(prev => {
                  if (prev.some(n => n.dedupKey === notifDedup)) return prev;
                  return [
                    {
                      id: generateUniqueId('notif_bounty_team'),
                      dedupKey: notifDedup,
                      userId: hId,
                      title: `🤝 TEAM BOUNTY SELESAI! ${instance.name}`,
                      message: `Misi Tim selesai! Kontributor menerima bagian +${hXp} XP & +${hBpc} BPC!`,
                      type: 'BOUNTY',
                      xpGain: hXp,
                      bpcGain: hBpc,
                      timestamp: new Date().toISOString(),
                      isRead: false,
                    },
                    ...prev,
                  ];
                });
              });
            }

            soundEffects.playBountyComplete();
            triggerCelebration({
              type: 'BOUNTY_COMPLETE',
              title: `🎯 TEAM BOUNTY COMPLETE!`,
              subtitle: `${instance.name} (${instance.frequency}) Berhasil Dituntaskan Bersama!`,
              xpGain: instance.xpReward,
              bpcGain: instance.bpcReward,
              timestamp: Date.now(),
            });
          }
        } else {
          const soloClaimId = `${instance.periodKey}_${hunterId}_${instance.templateId}`;
          const legacyClaimId = `${hunterId}_${instance.id}`;
          const alreadyClaimed = bountyClaims.some(
            c =>
              c.id === soloClaimId ||
              c.id === legacyClaimId ||
              (c.userId === hunterId && c.templateId === instance.templateId && c.periodKey === instance.periodKey)
          );

          if (prog.isCompleted && !alreadyClaimed) {
            const newClaim: BountyClaim = {
              id: soloClaimId,
              bountyInstanceId: instance.id,
              templateId: instance.templateId,
              userId: hunterId,
              periodKey: instance.periodKey,
              completedAt: new Date().toISOString(),
              xpAwarded: instance.xpReward,
              bpcAwarded: instance.bpcReward,
              rewardGranted: true,
              bountyMode: 'SOLO',
            };

            setBountyClaims(prev =>
              prev.some(c => c.id === soloClaimId || c.id === legacyClaimId) ? prev : [...prev, newClaim]
            );

            setBountyHistory(prev => [
              {
                id: generateUniqueId('hist'),
                bountyInstanceId: instance.id,
                templateId: instance.templateId,
                name: instance.name,
                frequency: instance.frequency,
                rarity: instance.rarity,
                periodLabel: instance.periodKey,
                periodKey: instance.periodKey,
                targetValue: instance.targetValue,
                currentProgress: prog.current,
                isCompleted: true,
                completedAt: new Date().toISOString(),
                xpAwarded: instance.xpReward,
                bpcAwarded: instance.bpcReward,
                userId: hunterId,
              },
              ...prev,
            ]);

            awardHunterProgress(
              hunterId,
              instance.xpReward,
              instance.bpcReward,
              `Bounty Complete: ${instance.name}`
            );

            soundEffects.playBountyComplete();

            triggerCelebration({
              type: 'BOUNTY_COMPLETE',
              title: `🎯 BOUNTY COMPLETE!`,
              subtitle: `${instance.name} (${instance.frequency}) Berhasil Dituntaskan!`,
              xpGain: instance.xpReward,
              bpcGain: instance.bpcReward,
              timestamp: Date.now(),
            });

            const notifDedup = `BOUNTY_SOLO_${hunterId}_${instance.periodKey}_${instance.templateId}`;
            setNotifications(prev => {
              if (prev.some(n => n.dedupKey === notifDedup)) return prev;
              return [
                {
                  id: generateUniqueId('notif_bounty'),
                  dedupKey: notifDedup,
                  userId: hunterId,
                  title: `🎯 BOUNTY COMPLETE! ${instance.name}`,
                  message: `Misi ${instance.description} selesai! Mendapatkan +${instance.xpReward} XP dan +${instance.bpcReward} BPC!`,
                  type: 'BOUNTY',
                  xpGain: instance.xpReward,
                  bpcGain: instance.bpcReward,
                  timestamp: new Date().toISOString(),
                  isRead: false,
                },
                ...prev,
              ];
            });
          }
        }
      });
    },
    [activeBountyInstances, getBountyProgress, bountyClaims, currentUser.id, users, awardHunterProgress, triggerCelebration, orders, leads]
  );

  const checkPersonalRecords = useCallback(
    (hunterId: string, newOrderVal: number, newLeadsCount: number) => {
      setHunterStats(prev => {
        const curr = prev[hunterId];
        if (!curr) return prev;

        const records = { ...curr.personalRecords };
        let recordBroken = false;
        let recordTitle = '';

        if (newOrderVal > records.highestDailyOmset) {
          records.highestDailyOmset = newOrderVal;
          records.highestDailyOmsetDate = getWitaDateString();
          recordBroken = true;
          recordTitle = 'Omset Harian Tertinggi Baru!';
        }

        if (newLeadsCount > records.mostLeadsInOneDay) {
          records.mostLeadsInOneDay = newLeadsCount;
          records.mostLeadsDate = getWitaDateString();
          recordBroken = true;
          recordTitle = 'Rekor Leads Harian Baru!';
        }

        if (recordBroken) {
          triggerCelebration({
            type: 'PERSONAL_RECORD',
            title: `🚨 NEW PERSONAL RECORD!`,
            subtitle: `${curr.userId}: ${recordTitle}`,
            timestamp: Date.now(),
          });
        }

        return {
          ...prev,
          [hunterId]: {
            ...curr,
            personalRecords: records,
          },
        };
      });
    },
    [triggerCelebration]
  );

  const addCustomer = useCallback(
    (customerData: {
      name: string;
      phone: string;
      email?: string;
      channel: Channel;
      notes?: string;
      assignedHunterId?: string;
    }) => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.', isExisting: false };
      }

      const now = new Date().toISOString();
      const cleanPhone = customerData.phone.replace(/[^0-9]/g, '');

      const existing = customers.find(
        c => c.phone.replace(/[^0-9]/g, '') === cleanPhone
      );

      if (existing) {
        const updatedCustomer: Customer = {
          ...existing,
          name: customerData.name || existing.name,
          email: customerData.email || existing.email,
          channel: customerData.channel || existing.channel,
          notes: customerData.notes ? `${existing.notes || ''} | ${customerData.notes}` : existing.notes,
          assignedHunterId: customerData.assignedHunterId || existing.assignedHunterId,
          lastActiveAt: now,
          updatedAt: now,
        };

        setCustomers(prev => prev.map(c => (c.id === existing.id ? updatedCustomer : c)));
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, updatedCustomer);
        return { success: true, customer: updatedCustomer, isExisting: true };
      }

      const newCustomer: Customer = {
        id: generateUniqueId('cust'),
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        channel: customerData.channel,
        notes: customerData.notes,
        status: 'Lead',
        firstLeadAt: now,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        totalOrdersCount: 0,
        totalOmset: 0,
        assignedHunterId: customerData.assignedHunterId || currentUser.id,
      };

      setCustomers(prev => [newCustomer, ...prev]);
      upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, newCustomer);
      return { success: true, customer: newCustomer, isExisting: false };
    },
    [customers, currentUser.id, currentUser.role]
  );

  const deleteCustomer = useCallback((customerId: string) => {
    if (currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Akses Ditolak: Hanya Admin yang dapat menghapus data customer.' };
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    deleteDocById(CLOUD_COLLECTIONS.CUSTOMERS, customerId);
    return { success: true };
  }, [currentUser.role]);

  const addLead = useCallback(
    (leadData: {
      customerId?: string;
      customerName: string;
      customerPhone: string;
      channel: Channel;
      product: string;
      status: LeadStatus;
      notes: string;
      hunterId: string;
    }) => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.', leadId: '' };
      }

      // Non-Admin tidak boleh mengatasnamakan hunter lain saat input data
      const effectiveHunterId = currentUser.role === 'ADMIN' ? leadData.hunterId : currentUser.id;
      leadData = { ...leadData, hunterId: effectiveHunterId };

      const now = new Date().toISOString();
      const hunter = users.find(u => u.id === leadData.hunterId) || currentUser;
      const cleanPhone = leadData.customerPhone.replace(/[^0-9]/g, '');

      let customer = leadData.customerId
        ? customers.find(c => c.id === leadData.customerId)
        : null;

      if (!customer && cleanPhone) {
        customer = customers.find(
          c => c.phone.replace(/[^0-9]/g, '') === cleanPhone
        );
      }

      let customerId = customer ? customer.id : (leadData.customerId || generateUniqueId('cust'));

      if (!customer) {
        customer = {
          id: customerId,
          name: leadData.customerName,
          phone: leadData.customerPhone,
          channel: leadData.channel,
          notes: leadData.notes,
          status: 'Lead',
          firstLeadAt: now,
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
          totalOrdersCount: 0,
          totalOmset: 0,
          assignedHunterId: leadData.hunterId,
        };
        setCustomers(prev => [customer!, ...prev]);
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, customer);
      } else {
        const updatedExistingCustomer: Customer = {
          ...customer,
          name: leadData.customerName || customer.name,
          channel: leadData.channel || customer.channel,
          lastActiveAt: now,
          updatedAt: now,
          notes: leadData.notes ? `${customer.notes ? customer.notes + ' | ' : ''}${leadData.notes}` : customer.notes,
        };
        setCustomers(prev => prev.map(c => (c.id === customerId ? updatedExistingCustomer : c)));
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, updatedExistingCustomer);
        customer = updatedExistingCustomer;
      }

      const newLead: Lead = {
        id: generateUniqueId('lead'),
        customerId,
        customerName: customer ? customer.name : leadData.customerName,
        customerPhone: customer ? customer.phone : leadData.customerPhone,
        channel: leadData.channel,
        product: leadData.product,
        status: leadData.status,
        notes: leadData.notes,
        hunterId: leadData.hunterId,
        hunterName: hunter.displayName,
        createdAt: now,
        updatedAt: now,
      };

      const nextLeads = [newLead, ...leads];
      setLeads(nextLeads);
      upsertDoc(CLOUD_COLLECTIONS.LEADS, newLead);

      const xpGained = actionXpConfig.newLeadXp;
      awardHunterProgress(leadData.hunterId, xpGained, 2, 'Input Lead Baru');
      soundEffects.playSuccess();

      evaluateActiveBounties(leadData.hunterId, orders, nextLeads);
      const hunterLeadsToday = nextLeads.filter(
        l => l.hunterId === leadData.hunterId && getWitaDateString(new Date(l.createdAt)) === getWitaDateString()
      ).length;
      checkPersonalRecords(leadData.hunterId, 0, hunterLeadsToday);

      return { success: true, leadId: newLead.id };
    },
    [customers, users, currentUser, actionXpConfig, awardHunterProgress, evaluateActiveBounties, checkPersonalRecords, leads, orders]
  );

  const updateCustomer = useCallback(
    (
      customerId: string,
      updates: {
        name?: string;
        phone?: string;
        email?: string;
        channel?: Channel;
        notes?: string;
        status?: import('../types').CustomerStatus;
        assignedHunterId?: string;
        newLeadStatus?: LeadStatus;
        newProduct?: string;
      }
    ) => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.' };
      }

      const now = new Date().toISOString();
      const existingCustomer = customers.find(c => c.id === customerId);

      // `workingLeads` dijaga sebagai satu "sumber kebenaran" yang mengalir
      // lewat kedua blok di bawah (rename & update status), supaya blok
      // kedua tidak pernah menulis ulang leads pakai data leads yang lama
      // dan menimpa balik hasil rename dari blok pertama. `leadsDirty`
      // menandai apakah leads benar-benar berubah, supaya kita cuma
      // memanggil setLeads() sekali di akhir kalau memang ada perubahan.
      let workingLeads = leads;
      let leadsDirty = false;

      if (existingCustomer) {
        const updatedCustomer: Customer = {
          ...existingCustomer,
          name: updates.name ?? existingCustomer.name,
          phone: updates.phone ?? existingCustomer.phone,
          email: updates.email ?? existingCustomer.email,
          channel: updates.channel ?? existingCustomer.channel,
          notes: updates.notes ?? existingCustomer.notes,
          status: updates.status ?? existingCustomer.status,
          assignedHunterId: updates.assignedHunterId ?? existingCustomer.assignedHunterId,
          lastActiveAt: now,
          updatedAt: now,
        };
        setCustomers(prev => prev.map(c => (c.id === customerId ? updatedCustomer : c)));
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, updatedCustomer);

        // Nama customer di Lead & Order itu "salinan" (denormalized), bukan
        // referensi hidup — jadi kalau nama customer berubah, semua Lead dan
        // Order milik customer ini harus ikut di-update satu-satu supaya
        // tidak nyangkut nama lama.
        if (updates.name && updates.name !== existingCustomer.name) {
          console.log('[DEBUG updateCustomer] Rename terdeteksi:', {
            customerId,
            namaLama: existingCustomer.name,
            namaBaru: updates.name,
            totalLeadsDiState: workingLeads.length,
          });
          const relatedLeads = workingLeads.filter(l => l.customerId === customerId);
          console.log('[DEBUG updateCustomer] Leads yang cocok customerId:', relatedLeads.map(l => ({ id: l.id, customerId: l.customerId, customerNameLama: l.customerName })));
          if (relatedLeads.length > 0) {
            const renamedById = new Map(relatedLeads.map(l => [l.id, { ...l, customerName: updates.name!, updatedAt: now }]));
            workingLeads = workingLeads.map(l => renamedById.get(l.id) ?? l);
            leadsDirty = true;
            renamedById.forEach(l => {
              console.log('[DEBUG updateCustomer] Menulis ke Firestore leads/' + l.id, l);
              upsertDoc(CLOUD_COLLECTIONS.LEADS, l)
                .then(() => console.log('[DEBUG updateCustomer] Sukses simpan leads/' + l.id))
                .catch(err => console.error('[DEBUG updateCustomer] GAGAL simpan leads/' + l.id, err));
            });
          } else {
            console.warn('[DEBUG updateCustomer] Tidak ada lead yang cocok customerId ini — rename customer TIDAK akan tercermin di Leads.');
          }

          const relatedOrders = orders.filter(o => o.customerId === customerId);
          if (relatedOrders.length > 0) {
            const renamedOrders = relatedOrders.map(o => ({ ...o, customerName: updates.name!, updatedAt: now }));
            setOrders(prev => prev.map(o => renamedOrders.find(r => r.id === o.id) ?? o));
            renamedOrders.forEach(o => upsertDoc(CLOUD_COLLECTIONS.ORDERS, o));
          }
        }
      }

      if (updates.newLeadStatus) {
        const matching = workingLeads.find(l => l.customerId === customerId);
        if (matching) {
          const updatedLead: Lead = {
            ...matching,
            status: updates.newLeadStatus!,
            product: updates.newProduct || matching.product,
            updatedAt: now,
          };
          workingLeads = workingLeads.map(l => (l.id === matching.id ? updatedLead : l));
          leadsDirty = true;
          upsertDoc(CLOUD_COLLECTIONS.LEADS, updatedLead);
        }

        if (updates.newLeadStatus === 'Follow-up') {
          awardHunterProgress(currentUser.id, actionXpConfig.followUpXp, 5, 'Follow-up Customer');
        } else if (updates.newLeadStatus === 'Quotation') {
          awardHunterProgress(currentUser.id, actionXpConfig.quotationXp, 8, 'Kirim Quotation Penawaran');
        }

        soundEffects.playSuccess();
        evaluateActiveBounties(currentUser.id, orders, workingLeads);
      }

      if (leadsDirty) {
        setLeads(workingLeads);
      }

      return { success: true };
    },
    [currentUser.id, currentUser.role, actionXpConfig, awardHunterProgress, evaluateActiveBounties, leads, orders, customers]
  );

  const recordOrder = useCallback(
    (orderData: {
      customerId: string;
      leadId?: string;
      customerName: string;
      customerPhone: string;
      channel: Channel;
      product: string;
      orderValue: number;
      hunterId: string;
      notes?: string;
    }) => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.', orderId: '' };
      }

      // Non-Admin tidak boleh mengatasnamakan hunter lain saat mencatat order
      const effectiveHunterId = currentUser.role === 'ADMIN' ? orderData.hunterId : currentUser.id;
      orderData = { ...orderData, hunterId: effectiveHunterId };

      const now = new Date().toISOString();
      const hunter = users.find(u => u.id === orderData.hunterId) || currentUser;
      const cleanPhone = orderData.customerPhone.replace(/[^0-9]/g, '');

      let targetCustomerId = orderData.customerId;
      const existingCustomer = customers.find(
        c => c.id === targetCustomerId || (cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone)
      );

      if (existingCustomer) {
        targetCustomerId = existingCustomer.id;
        const newTotalOrders = existingCustomer.totalOrdersCount + 1;
        const newTotalOmset = existingCustomer.totalOmset + orderData.orderValue;
        const newStatus: import('../types').CustomerStatus = newTotalOrders >= 2 ? 'Repeat Customer' : 'Active Customer';

        const updatedCustomer: Customer = {
          ...existingCustomer,
          name: orderData.customerName || existingCustomer.name,
          channel: orderData.channel || existingCustomer.channel,
          totalOrdersCount: newTotalOrders,
          totalOmset: newTotalOmset,
          status: newStatus,
          lastActiveAt: now,
          updatedAt: now,
        };
        setCustomers(prev => prev.map(c => (c.id === targetCustomerId ? updatedCustomer : c)));
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, updatedCustomer);
      } else {
        targetCustomerId = generateUniqueId('cust');
        const newCust: Customer = {
          id: targetCustomerId,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          channel: orderData.channel,
          notes: orderData.notes,
          status: 'Active Customer',
          firstLeadAt: now,
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
          totalOrdersCount: 1,
          totalOmset: orderData.orderValue,
          assignedHunterId: orderData.hunterId,
        };
        setCustomers(prev => [newCust, ...prev]);
        upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, newCust);
      }

      const newOrder: Order = {
        id: generateUniqueId('ord'),
        leadId: orderData.leadId,
        customerId: targetCustomerId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        channel: orderData.channel,
        product: orderData.product,
        orderValue: orderData.orderValue,
        orderDate: now,
        hunterId: orderData.hunterId,
        hunterName: hunter.displayName,
        status: 'SUCCESS',
        notes: orderData.notes,
        createdAt: now,
        updatedAt: now,
      };

      const nextOrders = [newOrder, ...orders];
      setOrders(nextOrders);
      upsertDoc(CLOUD_COLLECTIONS.ORDERS, newOrder);

      let nextLeads = leads;
      if (orderData.leadId) {
        const matchingLead = leads.find(l => l.id === orderData.leadId);
        if (matchingLead) {
          const updatedLead: Lead = { ...matchingLead, status: 'Order', updatedAt: now };
          nextLeads = leads.map(l => (l.id === orderData.leadId ? updatedLead : l));
          setLeads(nextLeads);
          upsertDoc(CLOUD_COLLECTIONS.LEADS, updatedLead);
        }
      }

      const xpGained = actionXpConfig.successfulOrderXp;
      const bpcGained = Math.max(15, Math.floor(orderData.orderValue / 500000) * 10);
      awardHunterProgress(orderData.hunterId, xpGained, bpcGained, `Order Berhasil: ${orderData.product}`);

      soundEffects.playCoin();

      evaluateActiveBounties(orderData.hunterId, nextOrders, nextLeads);
      checkPersonalRecords(orderData.hunterId, orderData.orderValue, 0);

      return { success: true, orderId: newOrder.id };
    },
    [customers, users, currentUser, actionXpConfig, awardHunterProgress, evaluateActiveBounties, checkPersonalRecords, orders, leads]
  );

  const updateOrderRevenue = useCallback(
    (orderId: string, newRevenue: number): { success: boolean; error?: string } => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.' };
      }

      if (typeof newRevenue !== 'number' || isNaN(newRevenue) || newRevenue < 0) {
        return { success: false, error: 'Nominal pendapatan harus berupa angka valid dan tidak boleh bernilai negatif.' };
      }

      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) {
        return { success: false, error: 'Order tidak ditemukan.' };
      }

      const diff = newRevenue - targetOrder.orderValue;
      const now = new Date().toISOString();

      const updatedOrder: Order = {
        ...targetOrder,
        orderValue: newRevenue,
        updatedAt: now,
      };
      const nextOrders = orders.map(o => (o.id === orderId ? updatedOrder : o));
      setOrders(nextOrders);
      upsertDoc(CLOUD_COLLECTIONS.ORDERS, updatedOrder);

      // Sinkronisasi total omset pelanggan jika nominal berubah
      if (diff !== 0 && targetOrder.customerId) {
        const targetCustomer = customers.find(c => c.id === targetOrder.customerId);
        if (targetCustomer) {
          const updatedCustomer: Customer = {
            ...targetCustomer,
            totalOmset: Math.max(0, targetCustomer.totalOmset + diff),
            updatedAt: now,
          };
          setCustomers(prev => prev.map(c => (c.id === targetOrder.customerId ? updatedCustomer : c)));
          upsertDoc(CLOUD_COLLECTIONS.CUSTOMERS, updatedCustomer);
        }
      }

      soundEffects.playClick();
      return { success: true };
    },
    [currentUser.role, orders, customers]
  );

  const purchaseCosmetic = useCallback(
    (cosmeticId: string): { success: boolean; error?: string } => {
      if (currentUser.role === 'VIEWER') {
        return { success: false, error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.' };
      }

      const item = cosmetics.find(c => c.id === cosmeticId);
      if (!item) return { success: false, error: 'Item kosmetik tidak ditemukan.' };

      if (currentHunterStat.unlockedCosmeticIds.includes(cosmeticId)) {
        return { success: false, error: 'Anda sudah memiliki item kosmetik ini!' };
      }

      if (currentHunterStat.level < item.requiredLevel) {
        return {
          success: false,
          error: `Level belum cukup! Diperlukan minimal Level ${item.requiredLevel}.`,
        };
      }

      if (currentHunterStat.bpcBalance < item.bpcPrice) {
        return {
          success: false,
          error: `Saldo BPC Anda (${currentHunterStat.bpcBalance}) tidak mencukupi harga (${item.bpcPrice} BPC).`,
        };
      }

      setHunterStats(prev => {
        const curr = prev[currentUser.id] || currentHunterStat;
        return {
          ...prev,
          [currentUser.id]: {
            ...curr,
            bpcBalance: curr.bpcBalance - item.bpcPrice,
            unlockedCosmeticIds: [...curr.unlockedCosmeticIds, cosmeticId],
          },
        };
      });

      setBpcTransactions(txs => [
        {
          id: generateUniqueId('tx_spend'),
          userId: currentUser.id,
          amount: -item.bpcPrice,
          type: 'SPEND',
          source: `Beli ${item.name} (${item.type})`,
          timestamp: new Date().toISOString(),
        },
        ...txs,
      ]);

      soundEffects.playSuccess();
      return { success: true };
    },
    [cosmetics, currentHunterStat, currentUser.id]
  );

  const createBountyTemplate = (template: Omit<BountyTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (currentUser.role !== 'ADMIN') return;
    const newTemplate: BountyTemplate = {
      ...template,
      id: generateUniqueId('bounty'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBountyTemplates(prev => [...prev, newTemplate]);
  };

  const updateBountyTemplate = (id: string, updates: Partial<BountyTemplate>) => {
    if (currentUser.role !== 'ADMIN') return;
    setBountyTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const duplicateBountyTemplate = (id: string) => {
    if (currentUser.role !== 'ADMIN') return;
    const orig = bountyTemplates.find(t => t.id === id);
    if (orig) {
      const copy: BountyTemplate = {
        ...orig,
        id: generateUniqueId('bounty'),
        name: `${orig.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBountyTemplates(prev => [...prev, copy]);
    }
  };

  const toggleBountyTemplate = (id: string) => {
    if (currentUser.role !== 'ADMIN') return;
    setBountyTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t))
    );
  };

  const archiveBountyTemplate = (id: string) => {
    if (currentUser.role !== 'ADMIN') return;
    setBountyTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isActive: false, updatedAt: new Date().toISOString() } : t))
    );
  };

  const deleteBountyTemplate = useCallback(
    (id: string): { success: boolean; error?: string } => {
      if (currentUser.role !== 'ADMIN') {
        return { success: false, error: 'Akses Ditolak: Hanya Admin yang dapat menghapus bounty.' };
      }
      try {
        const exists = bountyTemplates.some(t => t.id === id);
        if (!exists) {
          return { success: false, error: 'Bounty tidak ditemukan.' };
        }
        setBountyTemplates(prev => prev.filter(t => t.id !== id));
        setBountyClaims(prev => prev.filter(c => !c.bountyInstanceId.startsWith(id)));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Gagal menghapus bounty. Silakan coba lagi.' };
      }
    },
    [bountyTemplates, currentUser.role]
  );

  const addCosmeticItem = (item: Omit<CosmeticItem, 'id' | 'createdAt'>) => {
    if (currentUser.role !== 'ADMIN') return;
    const newItem: CosmeticItem = {
      ...item,
      id: generateUniqueId('cosm'),
      createdAt: new Date().toISOString(),
    };
    setCosmetics(prev => [...prev, newItem]);

    if (newItem.type === 'Theme' && newItem.themeDefinition) {
      try {
        const raw = localStorage.getItem('bpc_bounty_custom_themes');
        const customThemes: Record<string, ThemeDefinition> = raw ? JSON.parse(raw) : {};
        customThemes[newItem.themeDefinition.id] = newItem.themeDefinition;
        customThemes[newItem.themeDefinition.id.replace(/^theme_/, '')] = newItem.themeDefinition;
        localStorage.setItem('bpc_bounty_custom_themes', JSON.stringify(customThemes));
        window.dispatchEvent(new CustomEvent('bpc_theme_catalog_updated'));
      } catch (e) {
        console.error('Failed to sync new theme to ThemeContext:', e);
      }
    }
  };

  const updateCosmeticItem = (id: string, updates: Partial<CosmeticItem>) => {
    if (currentUser.role !== 'ADMIN') return;
    setCosmetics(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updated.type === 'Theme' && updated.themeDefinition) {
            try {
              const raw = localStorage.getItem('bpc_bounty_custom_themes');
              const customThemes: Record<string, ThemeDefinition> = raw ? JSON.parse(raw) : {};
              customThemes[updated.themeDefinition.id] = updated.themeDefinition;
              customThemes[updated.themeDefinition.id.replace(/^theme_/, '')] = updated.themeDefinition;
              localStorage.setItem('bpc_bounty_custom_themes', JSON.stringify(customThemes));
              window.dispatchEvent(new CustomEvent('bpc_theme_catalog_updated'));
            } catch (e) {
              console.error('Failed to sync updated theme to ThemeContext:', e);
            }
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCosmeticItem = (id: string) => {
    if (currentUser.role !== 'ADMIN') return;
    const itemToDelete = cosmetics.find(c => c.id === id);
    setCosmetics(prev => prev.filter(c => c.id !== id));

    if (itemToDelete && itemToDelete.type === 'Theme') {
      try {
        const raw = localStorage.getItem('bpc_bounty_custom_themes');
        if (raw) {
          const customThemes: Record<string, ThemeDefinition> = JSON.parse(raw);
          delete customThemes[itemToDelete.id];
          delete customThemes[itemToDelete.id.replace(/^theme_/, '')];
          if (itemToDelete.themeDefinition) {
            delete customThemes[itemToDelete.themeDefinition.id];
            delete customThemes[itemToDelete.themeDefinition.id.replace(/^theme_/, '')];
          }
          localStorage.setItem('bpc_bounty_custom_themes', JSON.stringify(customThemes));
          window.dispatchEvent(new CustomEvent('bpc_theme_catalog_updated'));
        }
      } catch (e) {
        console.error('Failed to remove deleted theme from custom_themes:', e);
      }
    }
  };

  const addAssetItem = (asset: Omit<AssetItem, 'id' | 'createdAt'>) => {
    if (currentUser.role !== 'ADMIN') return;
    const newAsset: AssetItem = {
      ...asset,
      id: generateUniqueId('asset'),
      createdAt: new Date().toISOString(),
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const deleteAssetItem = (id: string) => {
    if (currentUser.role !== 'ADMIN') return;
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateTargetConfig = (config: TargetConfig) => {
    if (currentUser.role !== 'ADMIN') return;
    setTargetConfig(config);
  };

  const updateLevelTiers = (tiers: LevelTier[]) => {
    if (currentUser.role !== 'ADMIN') return;
    setLevelTiers(tiers);
  };

  const updateRankTiers = (tiers: RankTier[]) => {
    if (currentUser.role !== 'ADMIN') return;
    setRankTiers(tiers);
  };

  const updateAchievements = (achievements: Achievement[]) => {
    if (currentUser.role !== 'ADMIN') return;
    setAchievements(achievements);
  };

  const updateActionXpConfig = (config: ActionXpConfig) => {
    if (currentUser.role !== 'ADMIN') return;
    setActionXpConfig(config);
  };

  const resetOperationalData = () => {
    if (currentUser.role !== 'ADMIN') return;
    setCustomers([]);
    setLeads([]);
    setOrders([]);
    // Ini operasi admin yang eksplisit ("kosongkan semua"), jadi hapus massal
    // di sini memang disengaja — bukan bagian dari alur tambah/edit biasa.
    clearCollectionDocs(CLOUD_COLLECTIONS.CUSTOMERS);
    clearCollectionDocs(CLOUD_COLLECTIONS.LEADS);
    clearCollectionDocs(CLOUD_COLLECTIONS.ORDERS);
    setBountyClaims([]);
    setBountyHistory([]);
    setBpcTransactions([]);
    setNotifications([]);

    const currentWitaDate = getWitaDateString();
    const updatedHunterStats: Record<string, HunterStats> = {};

    const allHunterIds = new Set<string>([
      ...users.map(u => u.id),
      ...Object.keys(hunterStats),
    ]);

    allHunterIds.forEach(id => {
      const existing = hunterStats[id];
      const preservedCosmetics =
        existing?.unlockedCosmeticIds && existing.unlockedCosmeticIds.length > 0
          ? existing.unlockedCosmeticIds
          : ['theme_fresh', 'title_lead_rookie', 'coin_gold'];

      updatedHunterStats[id] = {
        userId: id,
        xp: 0,
        level: 1,
        rankId: 'bronze',
        streak: 1,
        streakShields: 0,
        lastActiveDateWita: currentWitaDate,
        bpcBalance: 100,
        unlockedCosmeticIds: preservedCosmetics,
        unlockedAchievementIds: [],
        personalRecords: {
          highestDailyOmset: 0,
          highestConversionRate: 0,
          mostLeadsInOneDay: 0,
          longestStreak: 1,
          mostOrdersInOneDay: 0,
        },
      };
    });

    setHunterStats(updatedHunterStats);

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BOUNTY_CLAIMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BOUNTY_HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BPC_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HUNTER_STATS, JSON.stringify(updatedHunterStats));
  };

  const factoryReset = () => {
    if (currentUser.role !== 'ADMIN') return;
    setCustomers(INITIAL_CUSTOMERS);
    setLeads(INITIAL_LEADS);
    setOrders(INITIAL_ORDERS);
    // Operasi admin eksplisit: ganti seluruh isi collection dengan data awal.
    replaceCollectionDocs(CLOUD_COLLECTIONS.CUSTOMERS, INITIAL_CUSTOMERS);
    replaceCollectionDocs(CLOUD_COLLECTIONS.LEADS, INITIAL_LEADS);
    replaceCollectionDocs(CLOUD_COLLECTIONS.ORDERS, INITIAL_ORDERS);
    setBountyClaims([]);
    setBountyHistory([]);
    setHunterStats(INITIAL_HUNTER_STATS);
    setBpcTransactions([]);
    setNotifications([]);

    setBountyTemplates(INITIAL_BOUNTY_TEMPLATES);
    setLevelTiers(INITIAL_LEVEL_TIERS);
    setRankTiers(INITIAL_RANK_TIERS);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setCosmetics(INITIAL_COSMETICS);
    setAssets(INITIAL_ASSETS);
    setActionXpConfig(INITIAL_ACTION_XP);
    setTargetConfig(INITIAL_TARGET_CONFIG);

    factoryResetUsers();

    try {
      localStorage.removeItem('bpc_bounty_custom_themes');
      window.dispatchEvent(new CustomEvent('bpc_theme_catalog_updated'));
    } catch (e) {
      console.error(e);
    }

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.BOUNTY_TEMPLATES, JSON.stringify(INITIAL_BOUNTY_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.BOUNTY_CLAIMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BOUNTY_HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HUNTER_STATS, JSON.stringify(INITIAL_HUNTER_STATS));
    localStorage.setItem(STORAGE_KEYS.LEVEL_TIERS, JSON.stringify(INITIAL_LEVEL_TIERS));
    localStorage.setItem(STORAGE_KEYS.RANK_TIERS, JSON.stringify(INITIAL_RANK_TIERS));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(INITIAL_ACHIEVEMENTS));
    localStorage.setItem(STORAGE_KEYS.COSMETICS, JSON.stringify(INITIAL_COSMETICS));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem(STORAGE_KEYS.XP_CONFIG, JSON.stringify(INITIAL_ACTION_XP));
    localStorage.setItem(STORAGE_KEYS.TARGET_CONFIG, JSON.stringify(INITIAL_TARGET_CONFIG));
    localStorage.setItem(STORAGE_KEYS.BPC_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  };

  const resetToDefaultData = () => {
    factoryReset();
  };

  const exportBackupJson = (): string => {
    if (currentUser.role !== 'ADMIN') {
      return JSON.stringify({ error: 'Akses Ditolak: Hanya Admin yang dapat mengekspor cadangan sistem.' });
    }
    let customThemes: any = {};
    try {
      const rawThemes = localStorage.getItem('bpc_bounty_custom_themes');
      if (rawThemes) customThemes = JSON.parse(rawThemes);
    } catch (e) {
      console.error(e);
    }

    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      customers,
      leads,
      orders,
      bountyTemplates,
      hunterStats,
      cosmetics,
      assets,
      levelTiers,
      rankTiers,
      achievements,
      actionXpConfig,
      targetConfig,
      customThemes,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJson = (jsonData: string): boolean => {
    if (currentUser.role !== 'ADMIN') return false;
    try {
      const data = JSON.parse(jsonData);
      // Import backup = operasi admin eksplisit yang MEMANG bermaksud
      // mengganti seluruh dataset, jadi replace massal di sini disengaja.
      if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
        replaceCollectionDocs(CLOUD_COLLECTIONS.CUSTOMERS, data.customers);
      }
      if (Array.isArray(data.leads)) {
        setLeads(data.leads);
        replaceCollectionDocs(CLOUD_COLLECTIONS.LEADS, data.leads);
      }
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        replaceCollectionDocs(CLOUD_COLLECTIONS.ORDERS, data.orders);
      }
      if (Array.isArray(data.bountyTemplates)) setBountyTemplates(data.bountyTemplates);
      if (data.hunterStats && typeof data.hunterStats === 'object') setHunterStats(data.hunterStats);
      if (Array.isArray(data.cosmetics)) setCosmetics(reconcileUnifiedCosmetics(JSON.stringify(data.cosmetics)));
      if (Array.isArray(data.assets)) setAssets(data.assets);
      if (Array.isArray(data.levelTiers)) setLevelTiers(data.levelTiers);
      if (Array.isArray(data.rankTiers)) setRankTiers(data.rankTiers);
      if (Array.isArray(data.achievements)) setAchievements(data.achievements);
      if (data.actionXpConfig && typeof data.actionXpConfig === 'object') setActionXpConfig(data.actionXpConfig);
      if (data.targetConfig && typeof data.targetConfig === 'object') setTargetConfig(data.targetConfig);
      if (data.customThemes && typeof data.customThemes === 'object') {
        localStorage.setItem('bpc_bounty_custom_themes', JSON.stringify(data.customThemes));
        window.dispatchEvent(new CustomEvent('bpc_theme_catalog_updated'));
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        selectedHunterId,
        setSelectedHunterId,
        customers,
        leads,
        orders,
        stats,
        addLead,
        addCustomer,
        deleteCustomer,
        updateCustomer,
        recordOrder,
        updateOrderRevenue,
        bountyTemplates,
        activeBountyInstances,
        bountyHistory,
        hunterStats,
        currentHunterStat,
        levelTiers,
        rankTiers,
        achievements,
        cosmetics,
        assets,
        actionXpConfig,
        targetConfig,
        updateTargetConfig,
        bpcTransactions,
        notifications,
        activeCelebration,
        dismissCelebration,
        getBountyProgress,
        purchaseCosmetic,
        createBountyTemplate,
        updateBountyTemplate,
        duplicateBountyTemplate,
        toggleBountyTemplate,
        archiveBountyTemplate,
        deleteBountyTemplate,
        updateLevelTiers,
        updateRankTiers,
        updateAchievements,
        updateActionXpConfig,
        addCosmeticItem,
        updateCosmeticItem,
        deleteCosmeticItem,
        addAssetItem,
        deleteAssetItem,
        markNotificationRead,
        clearNotifications,
        resetOperationalData,
        factoryReset,
        resetToDefaultData,
        exportBackupJson,
        importBackupJson,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};