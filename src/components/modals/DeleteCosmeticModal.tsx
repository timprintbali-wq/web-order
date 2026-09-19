import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CosmeticItem } from '../../types';

interface DeleteCosmeticModalProps {
  item: CosmeticItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
  isDeleting?: boolean;
}

export const DeleteCosmeticModal: React.FC<DeleteCosmeticModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      id="delete-cosmetic-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="delete-cosmetic-modal-content"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-md w-full p-5 bg-surface border border-rose-500/30 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme">
          <div className="flex items-center gap-2.5 text-rose-500 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>HAPUS ITEM KOSMETIK</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme hover:bg-surface-alt cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-xs text-theme-secondary leading-relaxed">
            Apakah Anda yakin ingin menghapus item kosmetik ini dari katalog Guild Library?
          </p>

          {/* Item details card */}
          <div className="p-3.5 rounded-xl bg-surface-alt border border-theme space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-theme">{item.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500">
                {item.type}
              </span>
            </div>
            <p className="text-[11px] text-theme-muted">{item.description}</p>
            <div className="text-[10px] text-amber-500 font-mono font-bold pt-1">
              Harga: {item.bpcPrice === 0 ? 'Gratis' : `${item.bpcPrice} BPC`}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt hover:bg-surface border border-theme cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(item.id)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Item'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
