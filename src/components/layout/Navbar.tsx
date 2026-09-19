import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Users,
  TrendingUp,
  Award,
  SlidersHorizontal,
  Contact,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';

export type { TabType };

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  followUpAlertCount: number;
  activeBountiesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  followUpAlertCount,
  activeBountiesCount,
}) => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const tabs: {
    id: TabType;
    label: string;
    englishTag?: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    allowedRoles: ('ADMIN' | 'HUNTER' | 'VIEWER')[];
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      allowedRoles: ['ADMIN', 'HUNTER', 'VIEWER'],
    },
    {
      id: 'hunt-log',
      label: 'Hunt Log',
      icon: Compass,
      allowedRoles: ['ADMIN', 'HUNTER', 'VIEWER'],
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      badge: followUpAlertCount > 0 ? followUpAlertCount : undefined,
      badgeColor: 'bg-rose-500',
      allowedRoles: ['ADMIN', 'HUNTER', 'VIEWER'],
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: TrendingUp,
      allowedRoles: ['ADMIN', 'HUNTER'],
    },
    {
      id: 'data-customer',
      label: 'Customer Index',
      icon: Contact,
      allowedRoles: ['ADMIN', 'HUNTER', 'VIEWER'],
    },
    {
      id: 'bounty-board',
      label: 'Bounty Board',
      icon: Award,
      badge: activeBountiesCount > 0 ? activeBountiesCount : undefined,
      badgeColor: 'bg-amber-500',
      allowedRoles: ['ADMIN', 'HUNTER'],
    },
    {
      id: 'control-room',
      label: 'Guild Library',
      icon: SlidersHorizontal,
      allowedRoles: ['ADMIN'],
    },
  ];

  const visibleTabs = tabs.filter(t => t.allowedRoles.includes(role));

  return (
    <nav
      id="main-navigation"
      className="bg-surface border-b border-theme px-4 py-2 sticky top-[61px] md:top-[65px] z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-orange-500 text-white shadow-md shadow-slate-900/20 dark:shadow-orange-500/20'
                  : 'text-theme-secondary hover:text-theme hover:bg-surface-alt'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400 dark:text-white' : 'text-theme-muted'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-black text-white ${
                    isActive ? 'bg-orange-500 dark:bg-black/40' : tab.badgeColor || 'bg-orange-500'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
