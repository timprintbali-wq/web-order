import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MessageCircle,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Channel, Lead, LeadStatus } from '../../types';
import { formatPhoneNumber } from '../../utils/formatters';
import { HunterSelect } from '../common/HunterSelect';

export const LeadsView: React.FC = () => {
  const { currentUser, users } = useAuth();
  const { leads, updateCustomer, customers } = useData();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedHunter, setSelectedHunter] = useState<string>('ALL');

  // Selected Lead for details/quick status edit
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus>('Follow-up');
  const [newNotes, setNewNotes] = useState('');

  // Funnel calculations
  const totalLeadsCount = leads.length;
  const interestedCount = leads.filter(l => l.status === 'Follow-up').length;
  const quotationCount = leads.filter(l => l.status === 'Quotation').length;
  const orderCount = leads.filter(l => l.status === 'Order').length;
  const dropCount = leads.filter(l => l.status === 'Cancel' || l.status === 'Tidak Ada Respons').length;

  const filteredLeads = leads.filter(lead => {
    if (selectedChannel !== 'ALL' && lead.channel !== selectedChannel) return false;
    if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) return false;
    if (selectedHunter !== 'ALL' && lead.hunterId !== selectedHunter) return false;
    if (
      searchQuery &&
      !lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !lead.customerPhone.includes(searchQuery) &&
      !lead.product.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenStatusEdit = (lead: Lead) => {
    setEditingLead(lead);
    setNewStatus(lead.status);
    setNewNotes(lead.notes || '');
  };

  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    updateCustomer(editingLead.customerId, {
      newLeadStatus: newStatus,
      notes: newNotes,
    });

    setEditingLead(null);
  };

  const getWhatsAppLink = (phone: string, name: string, product: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Halo ${name}, salam dari Bali Printing Center (BPC)! Mengenai kebutuhan ${product}, ada yang bisa kami bantu?`
    );
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  return (
    <div id="leads-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Visual Lead Funnel Banner */}
      <div className="card-theme p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-theme">PIPELINE & LEAD FUNNEL</h3>
            <p className="text-xs text-theme-muted">
              Alur konversi dari kontak awal masuk hingga closing pemesanan
            </p>
          </div>
          <span className="text-xs font-bold font-mono text-theme">Total: {totalLeadsCount} Leads</span>
        </div>

        {/* 4-Step Funnel Visual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          {/* Step 1: Total Leads */}
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              1. LEAD MASUK
            </span>
            <span className="text-2xl font-black text-theme mt-1 font-mono">{totalLeadsCount}</span>
            <span className="text-[10px] text-theme-muted mt-0.5">100% Pipeline</span>
          </div>

          {/* Step 2: Follow-up / Interested */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              2. FOLLOW-UP
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {interestedCount}
            </span>
            <span className="text-[10px] text-theme-muted mt-0.5">Sedang Proses</span>
          </div>

          {/* Step 3: Quotation */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              3. QUOTATION
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
              {quotationCount}
            </span>
            <span className="text-[10px] text-theme-muted mt-0.5">Kirim Penawaran</span>
          </div>

          {/* Step 4: Closed Order */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              4. ORDER CLOSED
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {orderCount}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold mt-0.5">
              {totalLeadsCount > 0 ? Math.round((orderCount / totalLeadsCount) * 100) : 0}% Conv
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="card-theme p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Cari nama, nomor HP, produk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-theme-highlight"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              aria-label="Filter berdasarkan Status Lead"
              className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status Lead</option>
              <option value="Follow-up">Status: Follow-up</option>
              <option value="Quotation">Status: Quotation (Penawaran)</option>
              <option value="Order">Status: Order (Closing)</option>
              <option value="Cancel">Status: Cancel</option>
              <option value="Tidak Ada Respons">Status: Tidak Ada Respons</option>
            </select>
          </div>

          {/* Filter Channel */}
          <div>
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              aria-label="Filter berdasarkan Channel"
              className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none cursor-pointer"
            >
              <option value="ALL">Semua Channel</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Shopee">Shopee</option>
            </select>
          </div>

          {/* Filter Hunter */}
          <div>
            <HunterSelect
              id="leads-hunter-filter"
              selectedHunterId={selectedHunter}
              onChange={setSelectedHunter}
              users={users}
              allLabel="Semua Hunter (Team)"
              size="md"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Leads Table / Card List */}
      <div className="card-theme overflow-hidden border border-theme">
        <div className="p-4 border-b border-theme flex items-center justify-between bg-surface-alt/40">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-theme-primary" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-theme">
              DAFTAR LEADS ({filteredLeads.length})
            </h3>
          </div>
          <span className="text-[11px] text-theme-muted">
            Klik nomor HP untuk hubungi via WhatsApp langsung
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-theme-muted text-xs">
            Tidak ada data leads yang sesuai dengan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme bg-surface-alt/20 text-theme-muted font-bold text-[11px]">
                  <th className="p-3.5">Customer & Kontak</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Produk Minat</th>
                  <th className="p-3.5">Hunter</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Waktu Masuk</th>
                  {currentUser.role !== 'VIEWER' && (
                    <th className="p-3.5 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-theme">{lead.customerName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-theme-muted">
                          {formatPhoneNumber(lead.customerPhone)}
                        </span>
                        <a
                          href={getWhatsAppLink(lead.customerPhone, lead.customerName, lead.product)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 transition-all"
                          title="Buka Chat WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat WA</span>
                        </a>
                      </div>
                      {lead.notes && (
                        <div className="text-[11px] text-theme-muted mt-1 italic line-clamp-1">
                          "{lead.notes}"
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-alt border border-theme">
                        {lead.channel}
                      </span>
                    </td>

                    <td className="p-3.5 font-medium text-theme max-w-[200px] truncate">
                      {lead.product}
                    </td>

                    <td className="p-3.5 font-bold text-theme">{lead.hunterName}</td>

                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                          lead.status === 'Order'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : lead.status === 'Follow-up'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : lead.status === 'Quotation'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-theme-muted font-mono text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {currentUser.role !== 'VIEWER' && (
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenStatusEdit(lead)}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-theme-muted/10 border border-theme text-[11px] font-bold text-theme inline-flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK STATUS EDIT MODAL */}
      {editingLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingLead(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card-theme max-w-md w-full p-5 bg-surface border border-theme shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-theme">
              <h4 className="font-extrabold text-sm text-theme">Update Status Lead</h4>
              <button
                onClick={() => setEditingLead(null)}
                className="text-xs text-theme-muted hover:text-theme"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-theme">{editingLead.customerName}</div>
              <div className="text-[11px] text-theme-muted font-mono">{editingLead.customerPhone}</div>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Status Baru</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme outline-none"
                >
                  <option value="Follow-up">Follow-up</option>
                  <option value="Quotation">Quotation (Penawaran)</option>
                  <option value="Order">Order (Closing)</option>
                  <option value="Cancel">Cancel</option>
                  <option value="Tidak Ada Respons">Tidak Ada Respons</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme mb-1">Catatan Tambahan</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Tambahkan respon terbaru dari customer..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-theme-muted hover:text-theme"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-theme-primary text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
