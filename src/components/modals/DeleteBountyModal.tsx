import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { BountyTemplate } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';

interface DeleteBountyModalProps {
  bounty: BountyTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bountyId: string) => void;
  isDeleting?: boolean;
}

export const DeleteBountyModal: React.FC<DeleteBountyModalProps> = ({
  bounty,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !bounty) return null;

  return (
    <div
      id="delete-bounty-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="delete-bounty-modal"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-md w-full p-5 sm:p-6 relative border-2 border-rose-500/40 shadow-2xl bg-surface animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Danger Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-theme tracking-tight">
              Hapus Bounty?
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Progress dan konfigurasi bounty ini akan dihapus.
            </p>
          </div>
        </div>

        {/* Bounty Preview Card */}
        <div className="p-3.5 rounded-xl bg-surface-alt border border-theme my-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-theme text-sm">{bounty.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              {bounty.frequency}
            </span>
          </div>

          {bounty.description && (
            <p className="text-xs text-theme-muted leading-relaxed">
              {bounty.description}
            </p>
          )}

          <div className="pt-2 border-t border-theme flex flex-wrap items-center gap-3 text-[11px] font-medium text-theme-muted">
            <span>
              Target:{' '}
              <strong className="text-theme font-bold">
                {bounty.targetType === 'OMSET'
                  ? formatRupiah(bounty.targetValue)
                  : `${bounty.targetValue} Unit`}
              </strong>
            </span>
            <span>
              Reward:{' '}
              <strong className="text-sky-500 font-bold">+{bounty.xpReward} XP</strong> |{' '}
              <strong className="text-amber-500 font-bold">+{bounty.bpcReward} BPC</strong>
            </span>
          </div>
        </div>

        {/* Warning text */}
        <p className="text-[11px] text-rose-500/90 font-medium mb-5">
          ⚠️ Tindakan ini akan menghapus template misi secara permanen dari Quest Manager dan Bounty Board.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-theme">
          <button
            type="button"
            id="cancel-delete-bounty-btn"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-surface-alt hover:bg-theme-muted/10 border border-theme text-xs font-bold text-theme transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            id="confirm-delete-bounty-btn"
            onClick={() => onConfirm(bounty.id)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
