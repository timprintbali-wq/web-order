import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, ArrowRight } from 'lucide-react';
import { Order } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { formatWitaDateTime } from '../../utils/witaTime';

interface EditOrderRevenueModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, newRevenue: number) => { success: boolean; error?: string };
}

export const EditOrderRevenueModal: React.FC<EditOrderRevenueModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  const [nominalInput, setNominalInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      setNominalInput(order.orderValue.toString());
      setError(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const numericValue = Number(nominalInput.replace(/[^0-9]/g, ''));
  const isInputValid = !isNaN(numericValue) && numericValue >= 0 && nominalInput.trim() !== '';
  const diff = isInputValid ? numericValue - order.orderValue : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanStr = nominalInput.trim();
    if (!cleanStr) {
      setError('Nominal pendapatan wajib diisi.');
      return;
    }

    const val = Number(cleanStr.replace(/[^0-9]/g, ''));
    if (isNaN(val) || val < 0) {
      setError('Nominal pendapatan harus berupa angka valid dan tidak boleh negatif.');
      return;
    }

    const result = onSave(order.id, val);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Gagal memperbarui nominal order.');
    }
  };

  return (
    <div
      id="edit-order-revenue-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="edit-order-revenue-container"
        onClick={e => e.stopPropagation()}
        className="card-theme max-w-md w-full bg-surface border border-theme shadow-2xl overflow-hidden rounded-2xl"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-alt/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-theme">Edit Pendapatan Order</h3>
              <p className="text-xs text-theme-muted font-mono">
                Order #{order.id} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal edit pendapatan"
            className="p-2 rounded-xl bg-surface-alt hover:bg-theme-muted/20 text-theme-muted hover:text-theme cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informasi Order (Read-only context) */}
        <div className="p-4 sm:p-5 bg-surface-alt/25 border-b border-theme space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-theme-secondary">
            <div>
              <span className="text-[10px] text-theme-muted block font-semibold uppercase">Produk Cetak</span>
              <span className="font-bold text-theme truncate block">{order.product}</span>
            </div>
            <div>
              <span className="text-[10px] text-theme-muted block font-semibold uppercase">Channel & Closer</span>
              <span className="font-bold text-theme block truncate">
                {order.channel} • {order.hunterName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-muted block font-semibold uppercase">Tanggal Transaksi</span>
              <span className="font-medium text-theme-secondary block">
                {formatWitaDateTime(order.orderDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-muted block font-semibold uppercase">Nominal Saat Ini</span>
              <span className="font-black font-mono text-amber-600 dark:text-amber-400 block">
                {formatRupiah(order.orderValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Edit Nominal */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="order-revenue-input" className="block text-xs font-bold text-theme mb-1.5">
              Nominal Pendapatan / Omset Baru
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-theme-muted font-mono">
                Rp
              </span>
              <input
                id="order-revenue-input"
                type="number"
                required
                min="0"
                step="1"
                placeholder="cth. 1750000"
                value={nominalInput}
                onChange={e => setNominalInput(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-alt border border-theme focus:border-amber-500 text-sm font-black text-theme outline-none font-mono transition-colors"
              />
            </div>
            <p className="text-[11px] text-theme-muted mt-1.5 flex items-center justify-between font-mono">
              <span>Preview Terbaca:</span>
              <strong className="text-theme font-bold text-xs">
                {isInputValid ? formatRupiah(numericValue) : 'Rp0'}
              </strong>
            </p>
          </div>

          {/* Selisih / Perubahan kalkulasi */}
          {isInputValid && diff !== 0 && (
            <div className="p-3 rounded-xl bg-surface-alt border border-theme text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-theme-muted line-through">{formatRupiah(order.orderValue)}</span>
                <ArrowRight className="w-3 h-3 text-theme-muted" />
                <span className="font-mono font-bold text-theme">{formatRupiah(numericValue)}</span>
              </div>
              <span
                className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md ${
                  diff > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {diff > 0 ? `+${formatRupiah(diff)}` : `-${formatRupiah(Math.abs(diff))}`}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-theme flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-edit-revenue"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt border border-theme cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-edit-revenue"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
