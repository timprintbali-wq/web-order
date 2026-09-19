import { migrateLocalStorageToFirestore } from '../../services/firebase/firestoreService';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Download, X, AlertOctagon, CloudUpload, Loader2, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { exportBackupJson } = useData();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<null | { success: boolean; message: string }>(null);
  const REQUIRED_PHRASE = 'FACTORY RESET';

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === REQUIRED_PHRASE;

  const handleQuickBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bpc_backup_pre_factory_reset_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMigrateToCloud = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    const result = await migrateLocalStorageToFirestore();
    if (result.success) {
      setMigrationResult({ success: true, message: 'Data berhasil dipindahkan ke Cloud Firestore!' });
    } else {
      setMigrationResult({ success: false, message: result.error || 'Migrasi gagal, coba lagi.' });
    }
    setIsMigrating(false);
  };

  const handleExecute = () => {
    if (!isConfirmed) return;
    onConfirm();
    setConfirmationInput('');
    onClose();
  };

  return (
    <div
      id="factory-reset-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="factory-reset-modal"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-lg w-full p-5 sm:p-7 relative border-2 border-rose-500/60 shadow-2xl shadow-rose-500/20 bg-surface animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Danger Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-500 flex items-center justify-center text-2xl shrink-0 shadow-sm animate-pulse">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-rose-500 tracking-tight">
                FACTORY RESET
              </h3>
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-500 border border-rose-500/40">
                Destruktif Total
              </span>
            </div>
            <p className="text-xs text-theme-muted mt-0.5 leading-relaxed">
              Mengembalikan seluruh sistem aplikasi ke kondisi awal bawaan (seed data).
            </p>
          </div>
        </div>

        {/* Severe Warning Box */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 space-y-2 mb-4">
          <div className="flex items-center gap-2 font-bold text-rose-500">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>PERINGATAN PERMANEN</span>
          </div>
          <p className="text-[11px] text-theme-muted leading-relaxed">
            Tindakan ini <strong className="text-rose-500 font-bold">TIDAK BISA DIBATALKAN</strong>. Seluruh data kustom yang telah Anda buat akan terhapus, meliputi:
          </p>
          <ul className="text-[11px] text-theme-muted space-y-1 list-disc pl-4">
            <li>Semua item kosmetik hasil tempaan kustom (Forge items & custom BPC coins)</li>
            <li>Semua tema kustom hasil Theme Forge</li>
            <li>Semua akun Hunter & Admin baru yang telah dibuat</li>
            <li>Semua penyesuaian template Quest & Bounty</li>
            <li>Semua konfigurasi level, rank, dan base rewards kustom</li>
            <li>Semua data pelanggan, leads, pesanan, dan progres transaksi</li>
          </ul>
        </div>

        {/* Backup Option */}
        <div className="p-3 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-3">
          <p className="text-[11px] text-theme-muted leading-tight">
            Amankan data saat ini dengan mengunduh backup sebelum melakukan Factory Reset.
          </p>
          <button
            type="button"
            onClick={handleQuickBackup}
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-alt text-theme border border-theme text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Simpan Backup JSON</span>
          </button>
        </div>

        {/* Migrate to Cloud Option */}
        <div className="p-3 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-5">
          <p className="text-[11px] text-theme-muted leading-tight">
            Pindahkan data lokal kamu ke Cloud Firestore sebelum reset.
          </p>
          <button
            type="button"
            onClick={handleMigrateToCloud}
            disabled={isMigrating}
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-alt text-theme border border-theme text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? (
              <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>{isMigrating ? 'Sedang migrasi...' : 'Migrasi ke Cloud'}</span>
          </button>
        </div>

        {migrationResult && (
          <div
            className={`flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg mb-5 ${
              migrationResult.success
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
            }`}
          >
            {migrationResult.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{migrationResult.message}</span>
          </div>
        )}

        {/* Typed Confirmation Section */}
        <div className="space-y-2 mb-5">
          <label className="block text-xs font-bold text-theme">
            Ketik <span className="font-mono text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 select-all">FACTORY RESET</span> untuk konfirmasi:
          </label>
          <input
            type="text"
            id="factory-reset-confirmation-input"
            value={confirmationInput}
            onChange={e => setConfirmationInput(e.target.value)}
            placeholder="Ketik 'FACTORY RESET' di sini"
            className="w-full px-3.5 py-2 rounded-xl bg-surface-alt border border-theme text-xs text-theme focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-theme">
          <button
            type="button"
            id="cancel-factory-reset-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-alt hover:bg-theme-muted/10 text-theme text-xs font-bold transition-colors cursor-pointer"
          >
            Batalkan
          </button>
          <button
            type="button"
            id="confirm-factory-reset-btn"
            disabled={!isConfirmed}
            onClick={handleExecute}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-rose-600/30'
                : 'bg-rose-500/20 text-rose-500/50 border border-rose-500/20 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Permanen & Factory Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};