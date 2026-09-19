import React from 'react';
import { AlertTriangle, Trash2, X, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from '../../types';

interface DeleteHunterModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => void;
  isDeleting?: boolean;
}

export const DeleteHunterModal: React.FC<DeleteHunterModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div
      id="delete-hunter-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="delete-hunter-modal-content"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-lg w-full p-5 sm:p-6 bg-surface border border-rose-500/40 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme">
          <div className="flex items-center gap-2.5 text-rose-500 font-extrabold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>HAPUS AKUN HUNTER</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme hover:bg-surface-alt cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-surface-alt border border-theme flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/30"
          />
          <div>
            <div className="font-black text-sm text-theme flex items-center gap-2">
              <span>{user.displayName}</span>
              <span className="text-[10px] font-mono text-theme-muted">(@{user.username})</span>
            </div>
            <div className="text-xs text-theme-muted mt-0.5">
              Role: <span className="font-bold text-theme">{user.role}</span> • Status:{' '}
              <span className={user.isActive ? 'text-emerald-500 font-bold' : 'text-slate-500 font-bold'}>
                {user.isActive ? 'Aktif' : 'Non-aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Critical Historical Data Safety Notice */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>PROTEKSI DATA BISNIS & HISTORI OPERASIONAL</span>
          </div>
          <p className="text-[11px] text-theme leading-relaxed">
            Menghapus akun Hunter ini <strong>TIDAK akan menghapus atau merusak data riwayat bisnis</strong>.
            Semua catatan leads, order closing, nominal omset, dan laporan performa historis yang pernah dibuat oleh akun ini akan <strong>tetap tersimpan utuh dan aman 100%</strong> di database sistem.
          </p>
        </div>

        <p className="text-xs text-theme-muted">
          Akun ini tidak akan lagi dapat login ke sistem. Tindakan ini tidak dapat dibatalkan.
        </p>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt hover:bg-surface border border-theme cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user.id)}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus Akun...' : 'Konfirmasi Hapus Akun'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
