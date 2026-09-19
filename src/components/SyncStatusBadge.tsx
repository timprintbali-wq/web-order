import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { subscribeSyncStatus, SyncStatus } from '../lib/firestoreSync';

/**
 * Badge kecil di pojok layar yang nunjukin status sinkronisasi ke Firestore:
 * - Tersinkron (hijau): semua perubahan udah kekonfirmasi tersimpan
 * - Menyimpan... (kuning, animasi): ada tulisan yang lagi diproses
 * - Offline (merah): ada perubahan yang GAGAL / belum kekirim ke cloud
 *
 * Taruh <SyncStatusBadge /> sekali aja di root aplikasi (misal di App.tsx,
 * di luar routing), biar keliatan konsisten di semua halaman.
 */
export const SyncStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((s) => {
      setStatus(s);
      // Badge "Tersinkron" cuma ditampilin sebentar abis ada aktivitas,
      // biar nggak nongol terus-terusan waktu semuanya emang udah aman.
      // Badge "Menyimpan..." & "Offline" selalu ditampilin selama kondisi itu berlangsung.
      if (s === 'synced') {
        setVisible(true);
        const timeout = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timeout);
      }
      setVisible(true);
    });
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const config: Record<SyncStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    synced: {
      label: 'Tersinkron',
      classes: 'bg-emerald-600/90 text-white border-emerald-400/40',
      icon: <Cloud className="w-3.5 h-3.5" />,
    },
    syncing: {
      label: 'Menyimpan...',
      classes: 'bg-amber-500/90 text-white border-amber-300/40',
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
    },
    offline: {
      label: 'Offline — belum tersimpan ke cloud',
      classes: 'bg-rose-600/90 text-white border-rose-400/40',
      icon: <CloudOff className="w-3.5 h-3.5" />,
    },
  };

  const { label, classes, icon } = config[status];

  return (
    <div
      id="sync-status-badge"
      className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border backdrop-blur-sm transition-all duration-300 ${classes}`}
    >
      {icon}
      {label}
    </div>
  );
};