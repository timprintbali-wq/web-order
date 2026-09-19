import React from 'react';
import { Eraser, ShieldCheck, AlertCircle, Download, X, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ResetOperationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetOperationalModal: React.FC<ResetOperationalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { exportBackupJson } = useData();

  if (!isOpen) return null;

  const handleQuickBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bpc_backup_pre_operational_reset_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="reset-operational-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="reset-operational-modal"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-xl w-full p-5 sm:p-7 relative border-2 border-amber-500/40 shadow-2xl bg-surface animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            <Eraser className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-theme tracking-tight">
                Reset Data Operasional
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Aman untuk Config
              </span>
            </div>
            <p className="text-xs text-theme-muted mt-0.5 leading-relaxed">
              Bersihkan seluruh data transaksi dan progres aktivitas agar dashboard siap digunakan untuk operasional nyata.
            </p>
          </div>
        </div>

        {/* Comparison Grid: What is Cleared vs What is Kept Safe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {/* Cleared Section */}
          <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-500">
              <Eraser className="w-3.5 h-3.5" />
              <span>DIBERSIHKAN (TRANSAKSI)</span>
            </div>
            <ul className="text-[11px] text-theme-muted space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Semua Data Pelanggan & Leads</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Catatan Pesanan & Omset</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Riwayat Klaim & Progress Bounty</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Progres XP & Level Hunter (Reset ke Lvl 1)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Saldo BPC Hunter (Reset ke 100 BPC)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>Log Notifikasi & Transaksi BPC</span>
              </li>
            </ul>
          </div>

          {/* Preserved Section */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% AMAN & DIPERTAHANKAN</span>
            </div>
            <ul className="text-[11px] text-theme-muted space-y-1.5">
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-theme">Semua Akun Hunter & Admin</strong> (Login, Password, Nickname, Foto Profil)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-theme">Semua Kosmetik Tempaan (Forge)</strong> (BPC Coins, Custom Themes, Titles, Frames, Badges)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-theme">Semua File Aset Unggahan</strong> di Asset Forge</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-theme">Template & Konfigurasi Quest</strong> / Bounty Board</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-theme">Katalog Wizard Merchant</strong> & Base Rewards</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Backup Recommendation Box */}
        <div className="p-3 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-theme-muted leading-tight">
              Saran Guild Master: Unduh file cadangan data terlebih dahulu sebelum melakukan pembersihan operasional.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickBackup}
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-alt text-theme border border-theme text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Unduh Backup JSON</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-theme">
          <button
            type="button"
            id="cancel-reset-operational-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-alt hover:bg-theme-muted/10 text-theme text-xs font-bold transition-colors cursor-pointer"
          >
            Batalkan
          </button>
          <button
            type="button"
            id="confirm-reset-operational-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eraser className="w-4 h-4" />
            <span>Ya, Bersihkan Data Operasional</span>
          </button>
        </div>
      </div>
    </div>
  );
};
