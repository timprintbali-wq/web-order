import React, { useState, useEffect } from 'react';

import { ThemeProvider } from './context/ThemeContext';

import { AuthProvider, useAuth } from './context/AuthContext';

import { DataProvider, useData } from './context/DataContext';

import { Header } from './components/layout/Header';

import { Navbar, TabType } from './components/layout/Navbar';

import { OverviewView } from './components/views/OverviewView';

import { HuntLogView } from './components/views/HuntLogView';

import { LeadsView } from './components/views/LeadsView';

import { SalesView } from './components/views/SalesView';

import { CustomerDatabaseView } from './components/views/CustomerDatabaseView';

import { BountyBoardView } from './components/views/BountyBoardView';

import { ControlRoomView } from './components/views/ControlRoomView';

import { CelebrationModal } from './components/modals/CelebrationModal';

import { BountyShopModal } from './components/modals/BountyShopModal';

import { LoginScreen } from './components/auth/LoginScreen';
import { SyncStatusBadge } from './components/SyncStatusBadge';



const DashboardContent: React.FC = () => {

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [isShopOpen, setIsShopOpen] = useState(false);



  const { currentUser } = useAuth();

  const isAdmin = currentUser.role === 'ADMIN';



  const {

    activeCelebration,

    dismissCelebration,

    stats,

    activeBountyInstances,

  } = useData();



  // Route guard: role-based view restrictions

  useEffect(() => {

    if (currentUser.role === 'VIEWER') {

      if (activeTab === 'control-room' || activeTab === 'sales' || activeTab === 'bounty-board') {

        setActiveTab('overview');

      }

      if (isShopOpen) {

        setIsShopOpen(false);

      }

    } else if (activeTab === 'control-room' && !isAdmin) {

      setActiveTab('overview');

    }

  }, [activeTab, currentUser.role, isAdmin, isShopOpen]);



  return (

    <div className="min-h-screen bg-surface-alt text-theme flex flex-col transition-colors duration-200">

      {/* Top Progression HUD & Brand */}

      <Header onOpenShop={() => setIsShopOpen(true)} />



      {/* Primary Navigation */}

      <Navbar

        activeTab={activeTab}

        onSelectTab={setActiveTab}

        followUpAlertCount={stats.followUpAlertCount}

        activeBountiesCount={activeBountyInstances.length}

      />



      {/* Main Content Area */}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {activeTab === 'overview' && (

          <OverviewView

            onNavigateToLeads={() => setActiveTab('leads')}

            onNavigateToBounties={() => setActiveTab('bounty-board')}

            onNavigateToHuntLog={() => setActiveTab('hunt-log')}

          />

        )}

        {activeTab === 'hunt-log' && <HuntLogView />}

        {activeTab === 'leads' && <LeadsView />}

        {activeTab === 'sales' && <SalesView />}

        {activeTab === 'data-customer' && (

          <CustomerDatabaseView onNavigateToOrder={() => setActiveTab('hunt-log')} />

        )}

        {activeTab === 'bounty-board' && <BountyBoardView />}

        {activeTab === 'control-room' && isAdmin && <ControlRoomView />}

      </main>



      {/* Footer */}

      <footer className="border-t border-theme py-4 px-6 text-center text-xs text-theme-muted bg-surface">

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">

          <div className="flex items-center gap-1.5 font-bold text-theme">

            <span>🏴‍☠️ WEB ORDER BOUNTY HQ</span>

            <span>•</span>

            <span className="font-normal text-theme-muted">Bali Printing Center (BPC)</span>

          </div>

          <div className="font-mono text-[11px] text-theme-muted">

            Timezone: Asia/Makassar (WITA • UTC+8) • Real-time Operational Gamification

          </div>

        </div>

      </footer>



      {/* Gamification Modals */}

      <CelebrationModal

        celebration={activeCelebration}

        onClose={dismissCelebration}

      />



      <BountyShopModal

        isOpen={isShopOpen}

        onClose={() => setIsShopOpen(false)}

      />

    </div>

  );

};



// Gerbang Autentikasi: menampilkan Login Screen kalau belum login,

// dan HANYA memuat DataProvider (yang menyentuh Firestore/LocalStorage)

// setelah login berhasil.

const AuthGate: React.FC = () => {

  const { isAuthenticated } = useAuth();



  if (!isAuthenticated) {

    return <LoginScreen />;

  }



  return (

    <DataProvider>

      <DashboardContent />

    </DataProvider>

  );

};



export default function App() {

  return (

    <AuthProvider>

      <ThemeProvider>

        <AuthGate />

        {/* Badge status sinkronisasi Firestore — ditaruh di root supaya

            keliatan di semua halaman, termasuk sebelum login. */}

        <SyncStatusBadge />

      </ThemeProvider>

    </AuthProvider>

  );

}