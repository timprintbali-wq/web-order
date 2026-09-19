import { ThemeDefinition } from './theme';

export type UserRole = 'ADMIN' | 'HUNTER' | 'VIEWER';

export type Channel = 'Website' | 'WhatsApp' | 'Tokopedia' | 'Shopee';

export type LeadStatus = 'Order' | 'Follow-up' | 'Quotation' | 'Cancel' | 'Tidak Ada Respons';

export type CustomerStatus = 'Lead' | 'Active Customer' | 'Repeat Customer' | 'Inactive';

export type BountyFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BOSS';

export type CosmeticRarity =
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythical'
  | 'Divine'
  | 'Transcended';

export type BountyRarity = CosmeticRarity | 'Boss';

export type BountyTargetType = 
  | 'LEADS' 
  | 'SUCCESSFUL_ORDERS' 
  | 'OMSET' 
  | 'CONVERSION_RATE' 
  | 'FOLLOW_UPS' 
  | 'CUSTOM';

export type BountyDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Extreme';

export type BountyMode = 'SOLO' | 'TEAM';

export type TeamRewardMode = 'TOP_CONTRIBUTOR' | 'PROPORTIONAL' | 'EQUAL';

export type CosmeticType = 
  | 'Theme' 
  | 'Profile Frame' 
  | 'Profile Title' 
  | 'Achievement Badge' 
  | 'Treasure Map' 
  | 'Bounty Card' 
  | 'BPC Coin' 
  | 'Special Effect' 
  | 'Custom';

export type UnlockMethod = 
  | 'Purchase with BPC' 
  | 'Level Unlock' 
  | 'Achievement Unlock' 
  | 'Bounty Unlock' 
  | 'Special Event Unlock';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string; // securely simulated hash with salt
  avatarUrl?: string;
  bio?: string;
  equippedTheme: string;
  equippedFrame: string;
  equippedTitle: string;
  equippedBadge: string;
  equippedCoin: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: Channel;
  notes?: string;
  status?: CustomerStatus;
  firstLeadAt: string;
  lastActiveAt: string;
  createdAt?: string;
  updatedAt?: string;
  totalOrdersCount: number;
  totalOmset: number;
  assignedHunterId: string;
}

export interface Lead {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: Channel;
  product: string;
  status: LeadStatus;
  notes: string;
  hunterId: string;
  hunterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  leadId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: Channel;
  product: string;
  orderValue: number; // OMSET in IDR
  orderDate: string; // ISO date string
  hunterId: string;
  hunterName: string;
  status: 'SUCCESS' | 'CANCELLED' | 'PENDING';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BountyTemplate {
  id: string;
  name: string;
  description: string;
  frequency: BountyFrequency;
  rarity: BountyRarity;
  targetType: BountyTargetType;
  targetValue: number;
  channelScope: Channel | 'ALL';
  hunterScope: string; // 'ALL' or specific hunter user_id
  bountyMode?: BountyMode; // 'SOLO' | 'TEAM', default 'SOLO'
  teamRewardMode?: TeamRewardMode; // default 'TOP_CONTRIBUTOR'
  difficulty: BountyDifficulty;
  xpReward: number;
  bpcReward: number;
  requiredLevel: number;
  startDate?: string;
  endDate?: string;
  iconName: string;
  bannerColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BountyInstance {
  id: string;
  templateId: string;
  name: string;
  description: string;
  frequency: BountyFrequency;
  rarity: BountyRarity;
  targetType: BountyTargetType;
  targetValue: number;
  channelScope: Channel | 'ALL';
  hunterScope: string;
  bountyMode: BountyMode;
  teamRewardMode: TeamRewardMode;
  periodKey: string; // e.g., '2026-08-24', '2026-W35', '2026-08'
  periodStart: string;
  periodEnd: string;
  xpReward: number;
  bpcReward: number;
  iconName: string;
  isActive: boolean;
}

export interface BountyProgressResult {
  current: number;
  target: number;
  percentage: number;
  isCompleted: boolean;
  isRewardClaimed: boolean;
  bountyMode: BountyMode;
  teamRewardMode: TeamRewardMode;
  contributions?: Record<string, number>;
  topContributorId?: string;
  userContribution?: number;
}

export interface BountyClaim {
  id: string; // user_id + '_' + bounty_instance_id or periodKey_hunterId_templateId or periodKey_TEAM_templateId
  bountyInstanceId: string;
  templateId: string;
  userId: string; // hunter user_id or 'TEAM'
  periodKey: string;
  completedAt: string;
  xpAwarded: number;
  bpcAwarded: number;
  rewardGranted: boolean;
  bountyMode?: BountyMode;
}

export interface BountyHistoryItem {
  id: string;
  bountyInstanceId: string;
  templateId: string;
  name: string;
  frequency: BountyFrequency;
  rarity: BountyRarity;
  periodLabel: string;
  periodKey: string;
  targetValue: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  xpAwarded: number;
  bpcAwarded: number;
  userId: string;
}

export interface BPCTransaction {
  id: string;
  userId: string;
  amount: number; // positive for earn, negative for spend
  type: 'EARN' | 'SPEND' | 'ADMIN_ADJUST';
  source: string; // e.g. 'Bounty: Daily Lead Hunter', 'Purchased Midnight Theme'
  bountyInstanceId?: string;
  timestamp: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  type: CosmeticType;
  rarity: BountyRarity;
  assetUrl: string;
  previewAssetUrl?: string;
  bpcPrice: number;
  unlockMethod: UnlockMethod;
  unlockRequirement: string;
  requiredLevel: number;
  isActive: boolean;
  sortOrder: number;
  themeConfig?: Record<string, string>;
  themeDefinition?: ThemeDefinition;
  createdAt: string;
}

export interface AssetItem {
  id: string;
  name: string;
  category: 'BPC' | 'Frames' | 'Badges' | 'Maps' | 'Bounty Cards' | 'Themes' | 'Other';
  fileUrl: string;
  dimensions: string;
  format: string;
  fileSizeKb: number;
  createdAt: string;
}

export interface LevelTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  unlockName: string;
  unlockDescription: string;
  bpcReward: number;
  icon: string;
}

export interface RankTier {
  id: string;
  name: string;
  minMonthlyOmset: number;
  minConversionRate: number;
  badgeColor: string;
  icon: string;
  perks: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'LEADS' | 'ORDERS' | 'OMSET' | 'STREAK' | 'BOUNTY' | 'SPECIAL';
  targetValue: number;
  currentValue?: number;
  xpReward: number;
  bpcReward: number;
  badgeIcon: string;
  rarity: BountyRarity;
  isUnlocked?: boolean;
  unlockedAt?: string;
}

export interface PersonalRecords {
  highestDailyOmset: number;
  highestDailyOmsetDate?: string;
  highestConversionRate: number;
  mostLeadsInOneDay: number;
  mostLeadsDate?: string;
  longestStreak: number;
  mostOrdersInOneDay: number;
  mostOrdersDate?: string;
}

export interface HunterStats {
  userId: string;
  xp: number;
  level: number;
  rankId: string;
  streak: number;
  streakShields: number;
  lastActiveDateWita: string;
  bpcBalance: number;
  unlockedCosmeticIds: string[];
  unlockedAchievementIds: string[];
  personalRecords: PersonalRecords;
}

export interface NotificationItem {
  id: string;
  dedupKey?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'BOUNTY' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'RECORD' | 'STREAK' | 'FOLLOW_UP' | 'INFO';
  xpGain?: number;
  bpcGain?: number;
  timestamp: string;
  isRead: boolean;
}

export interface BaseRewardItem {
  id: 'new_lead' | 'follow_up' | 'quotation' | 'closing_order' | 'daily_streak';
  name: string;
  description: string;
  xpReward: number;
  bpcReward: number;
  isActive: boolean;
}

export interface ActionXpConfig {
  newLeadXp: number;
  newLeadBpc: number;
  newLeadActive: boolean;
  followUpXp: number;
  followUpBpc: number;
  followUpActive: boolean;
  quotationXp: number;
  quotationBpc: number;
  quotationActive: boolean;
  successfulOrderXp: number;
  successfulOrderBpc: number;
  successfulOrderActive: boolean;
  dailyStreakBonusXp: number;
  dailyStreakBonusBpc: number;
  dailyStreakBonusActive: boolean;
}

export interface TargetConfig {
  dailyTarget: number;
  monthlyTarget: number;
  individualMonthlyTarget?: number;
}

export type TabType =
  | 'overview'
  | 'hunt-log'
  | 'leads'
  | 'sales'
  | 'data-customer'
  | 'bounty-board'
  | 'control-room';

