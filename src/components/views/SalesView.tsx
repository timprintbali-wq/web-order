import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  ShoppingBag,
  Globe,
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  ArrowUpRight,
  Edit2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatNumber, formatPercent } from '../../utils/formatters';
import { Channel, Order } from '../../types';
import { EditOrderRevenueModal } from '../modals/EditOrderRevenueModal';

export const SalesView: React.FC = () => {
  const { currentUser, users } = useAuth();
  const { orders, stats, selectedHunterId, targetConfig, updateOrderRevenue } = useData();

  const monthlyTarget = targetConfig?.monthlyTarget || 150000000;
  const weeklyTarget = Math.round(monthlyTarget / 4);
  const dailyTarget = targetConfig?.dailyTarget || Math.round(monthlyTarget / 30);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('ALL');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(ord => {
    if (selectedChannelFilter !== 'ALL' && ord.channel !== selectedChannelFilter) return false;
    if (
      searchQuery &&
      !ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ord.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ord.product.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const channelIcons: Record<Channel, React.ElementType> = {
    Website: Globe,
    WhatsApp: MessageSquare,
    Tokopedia: ShoppingBag,
    Shopee: ShoppingBag,
  };

  return (
    <div id="sales-view" className="space-y-6 animate-in fade-in duration-300">
      {/* 3 OMSET TIMEFRAME HERO CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs uppercase font-extrabold text-theme-secondary tracking-wider">
              REALISASI OMSET & PENDAPATAN CETAK
            </h2>
            <p className="text-xs text-theme-secondary">
              Monitoring real-time omset closing divisi Web Order Bali Printing Center
            </p>
          </div>
          <span className="text-xs font-bold text-theme-secondary font-mono">WITA Asia/Makassar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* 1. OMSET HARI INI */}
          <div className="card-theme p-5 border-2 border-theme">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-theme-secondary">
                OMSET HARI INI
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                ☀️
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-theme mt-2 font-mono">
              {formatRupiah(stats.omsetToday)}
            </div>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-3 pt-3 border-t border-theme font-medium">
              <span>Target Harian: <strong className="text-theme font-bold">{formatRupiah(dailyTarget, true)}</strong></span>
              <span className="text-amber-500 font-bold">
                {dailyTarget > 0 ? Math.round((stats.omsetToday / dailyTarget) * 100) : 0}% Capai
              </span>
            </div>
          </div>

          {/* 2. OMSET MINGGU INI */}
          <div className="card-theme p-5 border-2 border-theme">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-theme-secondary">
                OMSET MINGGU INI
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                📅
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-theme mt-2 font-mono">
              {formatRupiah(stats.omsetThisWeek)}
            </div>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-3 pt-3 border-t border-theme font-medium">
              <span>Target Mingguan: <strong className="text-theme font-bold">{formatRupiah(weeklyTarget, true)}</strong></span>
              <span className="text-sky-500 font-bold">
                {weeklyTarget > 0 ? Math.round((stats.omsetThisWeek / weeklyTarget) * 100) : 0}% Capai
              </span>
            </div>
          </div>

          {/* 3. OMSET BULAN INI */}
          <div className="card-theme p-5 border-2 border-amber-500/30 bg-gradient-to-br from-surface to-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                OMSET BULAN INI
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                🏆
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
              {formatRupiah(stats.omsetThisMonth)}
            </div>
            <div className="flex items-center justify-between text-xs text-theme-secondary mt-3 pt-3 border-t border-theme font-medium">
              <span>Target Bulanan: <strong className="text-theme font-bold">{formatRupiah(monthlyTarget, true)}</strong></span>
              <span className="text-amber-500 font-bold">
                {monthlyTarget > 0 ? Math.round((stats.omsetThisMonth / monthlyTarget) * 100) : 0}% Capai
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OMSET BERDASARKAN CHANNEL */}
      <div className="card-theme p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-theme">KONTRIBUSI OMSET PER CHANNEL</h3>
            <p className="text-xs text-theme-secondary">Proporsi nilai transaksi closing berdasarkan sumber channel</p>
          </div>
          <span className="text-xs font-black font-mono text-theme">
            Total: {formatRupiah(stats.totalOmset)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Website', 'WhatsApp', 'Tokopedia', 'Shopee'] as Channel[]).map(ch => {
            const data = stats.channelBreakdown[ch];
            const percentOfTotal = stats.totalOmset > 0 ? Math.round((data.omset / stats.totalOmset) * 100) : 0;
            const Icon = channelIcons[ch];

            return (
              <div
                key={ch}
                className="p-4 rounded-xl bg-surface-alt border border-theme flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-theme-primary" />
                    <span className="font-bold text-xs text-theme">{ch}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono">{percentOfTotal}%</span>
                </div>

                <div className="text-xl font-black text-theme font-mono my-1">
                  {formatRupiah(data.omset)}
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden my-2 border border-slate-300/40 dark:border-slate-600/40">
                  <div
                    className="h-full bg-theme-primary rounded-full"
                    style={{ width: `${percentOfTotal}%` }}
                  />
                </div>

                <div className="text-[11px] text-theme-secondary flex items-center justify-between font-medium">
                  <span>{data.orders} Order Closing</span>
                  <span>{data.leads} Leads Masuk</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VERIFIED ORDER TRANSACTIONS TABLE */}
      <div className="card-theme overflow-hidden border border-theme">
        <div className="p-4 border-b border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-alt/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-theme-primary" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-theme">
              DAFTAR TRANSAKSI ORDER CLOSING ({filteredOrders.length})
            </h3>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Cari order, customer, produk..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 rounded-lg bg-surface border border-theme text-xs font-medium text-theme outline-none"
              />
            </div>

            <select
              value={selectedChannelFilter}
              onChange={e => setSelectedChannelFilter(e.target.value)}
              aria-label="Filter berdasarkan Channel Order"
              className="px-2.5 py-1 rounded-lg bg-surface border border-theme text-xs font-bold text-theme outline-none cursor-pointer"
            >
              <option value="ALL">Semua Channel</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Shopee">Shopee</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-theme-muted text-xs">
            Belum ada data transaksi order yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme bg-surface-alt/20 text-theme-muted font-bold text-[11px]">
                  <th className="p-3.5">ID Order & Tanggal</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Produk Cetak</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Closer Hunter</th>
                  <th className="p-3.5 text-right">Nilai Omset</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-theme">{order.id}</div>
                      <div className="text-[10px] text-theme-muted mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-theme">{order.customerName}</div>
                      <div className="text-[10px] text-theme-muted font-mono">{order.customerPhone}</div>
                    </td>

                    <td className="p-3.5 font-medium text-theme max-w-[220px] truncate">
                      {order.product}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-alt border border-theme">
                        {order.channel}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-theme">{order.hunterName}</td>

                    <td className="p-3.5 text-right">
                      <div className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                        {formatRupiah(order.orderValue)}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          order.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {order.status === 'SUCCESS' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Valid Omset
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Batal
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditingOrder(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-alt hover:bg-amber-500/15 text-theme hover:text-amber-600 dark:hover:text-amber-400 border border-theme hover:border-amber-500/30 transition-all cursor-pointer"
                        title="Edit nominal omset order ini"
                      >
                        <Edit2 className="w-3 h-3 text-amber-500" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDIT NOMINAL OMSET ORDER */}
      <EditOrderRevenueModal
        order={editingOrder}
        isOpen={Boolean(editingOrder)}
        onClose={() => setEditingOrder(null)}
        onSave={updateOrderRevenue}
      />
    </div>
  );
};
