import React, { useState } from 'react';
import {
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Search,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  UserPlus,
  Users,
  Package,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Channel, LeadStatus, Customer } from '../../types';
import { formatRupiah, formatPhoneNumber } from '../../utils/formatters';

const BALI_PRINTING_PRODUCTS = [
  'Brosur & Flyer Promosi (A5 Art Paper 150g)',
  'Kartu Nama Premium (Laminasi Doff/Glossy)',
  'Spanduk / Banner Outdoor Flexi China & Korchin',
  'Packaging Box & Kemasan Custom',
  'Stiker Vinyl Die Cut / Kiss Cut',
  'Buku Menu Resto & Cafe Hardcover',
  'Kalender Dinding / Meja Custom 2026',
  'Paper Bag Custom Brand',
  'Kaos Sablon DTF Custom',
  'Roll Up Banner / X-Banner Display',
];

interface HuntLogViewProps {
  initialAction?: 'TAMBAH_LEAD' | 'UPDATE_CUSTOMER' | 'CATAT_ORDER';
  initialCustomerId?: string;
}

export const HuntLogView: React.FC<HuntLogViewProps> = ({
  initialAction = 'TAMBAH_LEAD',
  initialCustomerId,
}) => {
  const { currentUser, users } = useAuth();
  const {
    customers,
    leads,
    orders,
    addLead,
    updateCustomer,
    recordOrder,
  } = useData();

  // Active Action State: 'TAMBAH_LEAD' | 'UPDATE_CUSTOMER' | 'CATAT_ORDER'
  const [activeAction, setActiveAction] = useState<
    'TAMBAH_LEAD' | 'UPDATE_CUSTOMER' | 'CATAT_ORDER'
  >(initialAction);

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  // Form States: Tambah Lead (Customer Baru vs Customer Lama)
  const [customerMode, setCustomerMode] = useState<'BARU' | 'LAMA'>('BARU');
  const [leadCustSearch, setLeadCustSearch] = useState('');
  const [showLeadCustDropdown, setShowLeadCustDropdown] = useState(false);
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);

  const [leadForm, setLeadForm] = useState<{
    customerId?: string;
    customerName: string;
    customerPhone: string;
    channel: Channel;
    product: string;
    status: LeadStatus;
    notes: string;
    hunterId: string;
  }>({
    customerId: undefined,
    customerName: '',
    customerPhone: '',
    channel: 'WhatsApp' as Channel,
    product: '',
    status: 'Follow-up' as LeadStatus,
    notes: '',
    hunterId: currentUser.id,
  });

  // Form States: Update Customer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({
    name: '',
    phone: '',
    channel: 'WhatsApp' as Channel,
    notes: '',
    newLeadStatus: 'Follow-up' as LeadStatus,
    newProduct: '',
  });

  // Form States: Catat Order
  const [orderForm, setOrderForm] = useState(() => {
    if (initialCustomerId) {
      const cust = customers.find(c => c.id === initialCustomerId);
      if (cust) {
        return {
          customerId: cust.id,
          customerName: cust.name,
          customerPhone: cust.phone,
          channel: cust.channel,
          product: '',
          orderValue: '',
          hunterId: currentUser.id,
          notes: '',
        };
      }
    }
    return {
      customerId: '',
      customerName: '',
      customerPhone: '',
      channel: 'WhatsApp' as Channel,
      product: '',
      orderValue: '',
      hunterId: currentUser.id,
      notes: '',
    };
  });

  // Autocomplete for order form customer search
  const [orderCustSearch, setOrderCustSearch] = useState('');
  const [showOrderCustDropdown, setShowOrderCustDropdown] = useState(false);

  // React to prop changes
  React.useEffect(() => {
    if (initialCustomerId) {
      const cust = customers.find(c => c.id === initialCustomerId);
      if (cust) {
        setActiveAction('CATAT_ORDER');
        setOrderForm(prev => ({
          ...prev,
          customerId: cust.id,
          customerName: cust.name,
          customerPhone: cust.phone,
          channel: cust.channel,
        }));
      }
    }
  }, [initialCustomerId, customers]);

  const channels: Channel[] = ['Website', 'WhatsApp', 'Tokopedia', 'Shopee'];
  const leadStatuses: LeadStatus[] = ['Follow-up', 'Quotation', 'Order', 'Cancel', 'Tidak Ada Respons'];

  // Handle Tambah Lead Submit
  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (customerMode === 'LAMA' && !leadForm.customerId) {
      setNotificationMsg({
        text: 'Silakan cari dan pilih Customer Lama terlebih dahulu dari daftar pencarian!',
        isError: true,
      });
      return;
    }

    if (!leadForm.customerName.trim() || !leadForm.customerPhone.trim()) {
      setNotificationMsg({ text: 'Nama customer dan nomor telepon wajib diisi!', isError: true });
      return;
    }

    const res = addLead(leadForm);
    if (res.success) {
      setNotificationMsg({
        text: `🎯 Berhasil mencatat Lead untuk "${leadForm.customerName}"! (+5 XP)`,
        isError: false,
      });
      // Reset form
      setLeadForm({
        customerId: undefined,
        customerName: '',
        customerPhone: '',
        channel: 'WhatsApp',
        product: BALI_PRINTING_PRODUCTS[0],
        status: 'Follow-up',
        notes: '',
        hunterId: currentUser.id,
      });
      setSelectedExistingCustomer(null);
      setLeadCustSearch('');
      setShowLeadCustDropdown(false);
    }
  };

  // Handle Update Customer Selection
  const handleSelectCustomerToUpdate = (cust: (typeof customers)[0]) => {
    setSelectedCustomer(cust.id);
    setUpdateForm({
      name: cust.name,
      phone: cust.phone,
      channel: cust.channel,
      notes: cust.notes || '',
      newLeadStatus: 'Follow-up',
      newProduct: BALI_PRINTING_PRODUCTS[0],
    });
  };

  // Handle Update Customer Submit
  const handleUpdateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const res = updateCustomer(selectedCustomer, updateForm);
    if (res.success) {
      setNotificationMsg({
        text: `🔄 Data customer "${updateForm.name}" berhasil diperbarui tanpa duplikasi lead!`,
        isError: false,
      });
      setSelectedCustomer(null);
    }
  };

  // Handle Catat Order Submit
  const handleRecordOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valueNum = Number(orderForm.orderValue.replace(/[^0-9]/g, ''));
    if (!orderForm.customerName.trim() || !valueNum || valueNum <= 0) {
      setNotificationMsg({
        text: 'Nama customer dan nilai nominal Omset yang valid wajib diisi!',
        isError: true,
      });
      return;
    }

    // Match customer or create ID
    let custId = orderForm.customerId;
    if (!custId) {
      const match = customers.find(
        c => c.phone.replace(/[^0-9]/g, '') === orderForm.customerPhone.replace(/[^0-9]/g, '')
      );
      custId = match ? match.id : 'cust_' + Date.now();
    }

    const res = recordOrder({
      customerId: custId,
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      channel: orderForm.channel,
      product: orderForm.product,
      orderValue: valueNum,
      hunterId: orderForm.hunterId,
      notes: orderForm.notes,
    });

    if (res.success) {
      setNotificationMsg({
        text: `💰 ORDER CLOSING BERHASIL! Omset ${formatRupiah(valueNum)} tercatat. (+50 XP & +BPC)`,
        isError: false,
      });
      setOrderForm({
        customerId: '',
        customerName: '',
        customerPhone: '',
        channel: 'WhatsApp',
        product: BALI_PRINTING_PRODUCTS[0],
        orderValue: '',
        hunterId: currentUser.id,
        notes: '',
      });
    }
  };

  // Filtered customer list for update search
  const searchedCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="hunt-log-view" className="space-y-6 animate-in fade-in duration-300">
      {/* 3 LARGE PRIMARY ACTIONS HEADER */}
      <div>
        {currentUser.role === 'VIEWER' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-base">👁️</span>
              <span>Mode Viewer (Read-Only) — Anda memiliki akses pemantauan operasional. Form entry data dinonaktifkan untuk role Viewer.</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
              Read-Only
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-theme">
              HUNT LOG — RUANG OPERASIONAL DATA ENTRY
            </h2>
            <p className="text-xs text-theme-secondary">
              Pilih tindakan di bawah untuk mencatat Lead baru, follow-up customer, atau catat order closing.
            </p>
          </div>
        </div>

        {/* 3 Large Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* ACTION 1: TAMBAH LEAD */}
          <button
            id="btn-action-tambah-lead"
            onClick={() => {
              setActiveAction('TAMBAH_LEAD');
              setNotificationMsg(null);
            }}
            className={`card-theme p-5 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden border-2 ${
              activeAction === 'TAMBAH_LEAD'
                ? 'border-sky-500 bg-sky-500/5 shadow-md shadow-sky-500/10'
                : 'border-theme hover:border-theme-highlight'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-2xl font-black">
                🏹
              </div>
              <span className="text-[11px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md">
                +5 XP / Lead
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-theme">1. TAMBAH LEAD</h3>
              <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                Catat kontak calon pembeli yang baru masuk dari Website, WA, Shopee, atau Tokopedia.
              </p>
            </div>
          </button>

          {/* ACTION 2: UPDATE CUSTOMER */}
          <button
            id="btn-action-update-customer"
            onClick={() => {
              setActiveAction('UPDATE_CUSTOMER');
              setNotificationMsg(null);
            }}
            className={`card-theme p-5 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden border-2 ${
              activeAction === 'UPDATE_CUSTOMER'
                ? 'border-teal-500 bg-teal-500/5 shadow-md shadow-teal-500/10'
                : 'border-theme hover:border-theme-highlight'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center text-2xl font-black">
                🔄
              </div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                Follow-up & Quotation
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-theme">2. UPDATE CUSTOMER</h3>
              <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                Cari customer yang sudah ada berdasarkan nama/HP, perbarui status follow-up & penawaran.
              </p>
            </div>
          </button>

          {/* ACTION 3: CATAT ORDER */}
          <button
            id="btn-action-catat-order"
            onClick={() => {
              setActiveAction('CATAT_ORDER');
              setNotificationMsg(null);
            }}
            className={`card-theme p-5 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden border-2 ${
              activeAction === 'CATAT_ORDER'
                ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10'
                : 'border-theme hover:border-theme-highlight'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl font-black">
                💰
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                +50 XP & +BPC
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-theme">3. CATAT ORDER</h3>
              <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                Catat transaksi closing yang berhasil. Otomatis menambahkan Omset & memicu progress Bounty!
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Notification / Feedback Banner */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
            notificationMsg.isError
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* ACTIVE ACTION FORM CONTAINER */}
      <div className="card-theme p-5 sm:p-7 border border-theme">
        {/* FORM 1: TAMBAH LEAD */}
        {activeAction === 'TAMBAH_LEAD' && (
          <form onSubmit={handleAddLeadSubmit} className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 pb-3 border-b border-theme mb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold">
                🏹
              </div>
              <div>
                <h3 className="font-black text-sm text-theme">FORM TAMBAH LEAD BARU</h3>
                <p className="text-xs text-theme-muted">
                  Pilih status customer (Baru / Lama) dan catat prospek lead masuk.
                </p>
              </div>
            </div>

            {/* Customer Mode Selection Toggle */}
            <div className="p-3 bg-surface-alt/40 rounded-xl border border-theme space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme">Pilih Jenis Customer:</span>
                <div className="flex items-center gap-1.5 p-1 bg-surface rounded-lg border border-theme">
                  <button
                    type="button"
                    id="btn-lead-customer-baru"
                    onClick={() => {
                      setCustomerMode('BARU');
                      setSelectedExistingCustomer(null);
                      setLeadForm(prev => ({
                        ...prev,
                        customerId: undefined,
                        customerName: '',
                        customerPhone: '',
                      }));
                      setLeadCustSearch('');
                      setShowLeadCustDropdown(false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      customerMode === 'BARU'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-theme-muted hover:text-theme'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>1. Customer Baru</span>
                  </button>
                  <button
                    type="button"
                    id="btn-lead-customer-lama"
                    onClick={() => {
                      setCustomerMode('LAMA');
                      setSelectedExistingCustomer(null);
                      setLeadForm(prev => ({
                        ...prev,
                        customerId: undefined,
                        customerName: '',
                        customerPhone: '',
                      }));
                      setLeadCustSearch('');
                      setShowLeadCustDropdown(false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      customerMode === 'LAMA'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-theme-muted hover:text-theme'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>2. Customer Lama</span>
                  </button>
                </div>
              </div>

              {/* Customer Lama Search Field */}
              {customerMode === 'LAMA' && (
                <div className="relative pt-1 border-t border-theme/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-theme flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-sky-500" />
                      Cari Customer Lama (Nama / Nomor WhatsApp) *
                    </label>
                    {selectedExistingCustomer && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Terpilih: #{selectedExistingCustomer.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExistingCustomer(null);
                            setLeadForm(prev => ({
                              ...prev,
                              customerId: undefined,
                              customerName: '',
                              customerPhone: '',
                            }));
                            setLeadCustSearch('');
                          }}
                          className="text-[11px] text-rose-500 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" /> Ganti
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    id="input-lead-search-customer"
                    placeholder="Ketik nama atau nomor HP customer lama (cth. Budi / 0812...)"
                    value={leadCustSearch}
                    onChange={e => {
                      setLeadCustSearch(e.target.value);
                      setShowLeadCustDropdown(true);
                    }}
                    onFocus={() => setShowLeadCustDropdown(true)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500"
                  />

                  {/* Dropdown search results */}
                  {showLeadCustDropdown && leadCustSearch.trim().length > 0 && !selectedExistingCustomer && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface border border-theme rounded-xl shadow-xl divide-y divide-theme">
                      {customers
                        .filter(
                          c =>
                            c.name.toLowerCase().includes(leadCustSearch.toLowerCase()) ||
                            c.phone.includes(leadCustSearch)
                        )
                        .slice(0, 6)
                        .map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedExistingCustomer(c);
                              setLeadForm(prev => ({
                                ...prev,
                                customerId: c.id,
                                customerName: c.name,
                                customerPhone: c.phone,
                                channel: c.channel || prev.channel,
                              }));
                              setLeadCustSearch(`${c.name} (${c.phone})`);
                              setShowLeadCustDropdown(false);
                            }}
                            className="p-2.5 text-xs hover:bg-sky-500/10 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="font-bold text-theme">{c.name}</div>
                              <div className="text-[11px] text-theme-muted font-mono mt-0.5">
                                {c.phone} • {c.channel} {c.totalOrdersCount > 0 ? `• ${c.totalOrdersCount}x Order` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md">
                              Pilih Customer
                            </span>
                          </div>
                        ))}
                      {customers.filter(
                        c =>
                          c.name.toLowerCase().includes(leadCustSearch.toLowerCase()) ||
                          c.phone.includes(leadCustSearch)
                      ).length === 0 && (
                        <div className="p-3 text-xs text-theme-muted text-center">
                          Tidak ditemukan customer dengan kata kunci "{leadCustSearch}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">
                  Nama Customer / Instansi *
                  {customerMode === 'LAMA' && (
                    <span className="ml-1.5 text-[10px] font-normal text-theme-muted">(Read-Only)</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  id="input-lead-customer-name"
                  placeholder={
                    customerMode === 'LAMA'
                      ? 'Pilih customer lama di atas...'
                      : 'cth. Villa Seminyak Sanctuary / Pak Made'
                  }
                  value={leadForm.customerName}
                  readOnly={customerMode === 'LAMA'}
                  onChange={e => {
                    if (customerMode === 'BARU') {
                      setLeadForm({ ...leadForm, customerName: e.target.value });
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl border border-theme text-xs font-medium text-theme outline-none ${
                    customerMode === 'LAMA'
                      ? 'bg-surface-alt/70 text-theme cursor-not-allowed opacity-90'
                      : 'bg-surface-alt focus:border-sky-500'
                  }`}
                />
              </div>

              {/* Phone / WA */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">
                  Nomor WhatsApp / HP *
                  {customerMode === 'LAMA' && (
                    <span className="ml-1.5 text-[10px] font-normal text-theme-muted">(Read-Only)</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  id="input-lead-customer-phone"
                  placeholder={
                    customerMode === 'LAMA' ? 'Otomatis terisi...' : 'cth. 081234567890'
                  }
                  value={leadForm.customerPhone}
                  readOnly={customerMode === 'LAMA'}
                  onChange={e => {
                    if (customerMode === 'BARU') {
                      setLeadForm({ ...leadForm, customerPhone: e.target.value });
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl border border-theme text-xs font-medium text-theme outline-none font-mono ${
                    customerMode === 'LAMA'
                      ? 'bg-surface-alt/70 text-theme cursor-not-allowed opacity-90'
                      : 'bg-surface-alt focus:border-sky-500'
                  }`}
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Channel Masuk</label>
                <select
                  value={leadForm.channel}
                  onChange={e => setLeadForm({ ...leadForm, channel: e.target.value as Channel })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500 cursor-pointer"
                >
                  {channels.map(ch => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">
                  Produk Cetak yang Diminati
                </label>
                <input
                  type="text"
                  list="bali-products-list"
                  placeholder="Ketik produk atau pilih (cth. Brosur A5, Box Kosmetik, Stiker...)"
                  value={leadForm.product}
                  onChange={e => setLeadForm({ ...leadForm, product: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Status Awal Lead</label>
                <select
                  value={leadForm.status}
                  onChange={e => setLeadForm({ ...leadForm, status: e.target.value as LeadStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500 cursor-pointer"
                >
                  {leadStatuses.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned Hunter */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Hunter Penanggung Jawab</label>
                <select
                  value={leadForm.hunterId}
                  onChange={e => setLeadForm({ ...leadForm, hunterId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500 cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-theme mb-1">Catatan Kebutuhan Customer</label>
              <textarea
                rows={2}
                placeholder="cth. Mau cetak brosur 500 pcs ukuran A5, minta contoh bahan Art Paper 150g"
                value={leadForm.notes}
                onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-3">
              {currentUser.role === 'VIEWER' ? (
                <div className="px-4 py-2.5 rounded-xl bg-surface-alt border border-theme text-theme-muted text-xs font-bold inline-flex items-center gap-2">
                  <span>🔒 Penginputan lead dinonaktifkan untuk Akun Viewer</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan Lead Baru (+5 XP)</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* FORM 2: UPDATE CUSTOMER */}
        {activeAction === 'UPDATE_CUSTOMER' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 pb-3 border-b border-theme mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold">
                🔄
              </div>
              <div>
                <h3 className="font-black text-sm text-theme">UPDATE CUSTOMER (ANTI-DUPLIKASI)</h3>
                <p className="text-xs text-theme-muted">
                  Cari customer yang sudah pernah masuk untuk memperbarui status follow-up atau penawaran.
                </p>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Cari nama customer, nomor HP, atau ID customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-teal-500"
              />
            </div>

            {/* Search Results List */}
            {!selectedCustomer && (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-theme rounded-xl p-2 bg-surface-alt/30">
                {searchedCustomers.length === 0 ? (
                  <p className="text-xs text-theme-muted text-center py-4">
                    Tidak ditemukan customer yang sesuai pencarian.
                  </p>
                ) : (
                  searchedCustomers.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomerToUpdate(cust)}
                      className="p-3 rounded-lg bg-surface border border-theme hover:border-teal-500 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-theme">{cust.name}</div>
                        <div className="text-[11px] text-theme-muted font-mono mt-0.5">
                          {cust.phone} • Channel: {cust.channel}
                        </div>
                        {cust.notes && (
                          <div className="text-[11px] text-theme-muted mt-1 italic line-clamp-1">
                            "{cust.notes}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md">
                          Pilih Update
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Edit Selected Customer Form */}
            {selectedCustomer && (
              <form
                onSubmit={handleUpdateCustomerSubmit}
                className="p-4 rounded-xl bg-surface-alt/50 border border-teal-500/30 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-theme">
                  <span className="font-bold text-xs text-teal-600 dark:text-teal-400">
                    Mengedit: {updateForm.name} ({updateForm.phone})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-theme-muted hover:text-theme underline cursor-pointer"
                  >
                    Ganti Customer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-theme mb-1">Status Progres Baru</label>
                    <select
                      value={updateForm.newLeadStatus}
                      onChange={e =>
                        setUpdateForm({ ...updateForm, newLeadStatus: e.target.value as LeadStatus })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme outline-none focus:border-teal-500"
                    >
                      {leadStatuses.map(st => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme mb-1">Produk Terkait</label>
                    <input
                      type="text"
                      list="bali-products-list"
                      placeholder="Ketik nama produk cetak..."
                      value={updateForm.newProduct}
                      onChange={e => setUpdateForm({ ...updateForm, newProduct: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme mb-1">Catatan Follow-up Terbaru</label>
                  <textarea
                    rows={2}
                    placeholder="cth. Sudah konfirmasi ukuran & kirim draft penawaran via WhatsApp..."
                    value={updateForm.notes}
                    onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {currentUser.role === 'VIEWER' ? (
                    <div className="px-4 py-2 rounded-xl bg-surface-alt border border-theme text-theme-muted text-xs font-bold inline-flex items-center gap-2">
                      <span>🔒 Perubahan data customer dinonaktifkan untuk Akun Viewer</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Simpan Perubahan Customer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="px-4 py-2 rounded-xl bg-surface border border-theme text-theme-muted hover:text-theme text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* FORM 3: CATAT ORDER */}
        {activeAction === 'CATAT_ORDER' && (
          <form onSubmit={handleRecordOrderSubmit} className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 pb-3 border-b border-theme mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                💰
              </div>
              <div>
                <h3 className="font-black text-sm text-theme">FORM CATAT ORDER CLOSING (OMSET)</h3>
                <p className="text-xs text-theme-muted">
                  Order sukses akan langsung menambah Omset dan memicu reward XP, BPC, dan Bounty!
                </p>
              </div>
            </div>

            {/* Existing Customer Quick Search Autocomplete */}
            <div className="p-3 bg-surface-alt/60 rounded-xl border border-theme">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-theme flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                  Cari & Pilih Customer Terdaftar (Otomatis Isi Nama & Telepon)
                </label>
                {orderForm.customerId && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Terhubung ke Customer #{orderForm.customerId}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Ketik untuk mencari customer lama..."
                value={orderCustSearch}
                onChange={e => {
                  setOrderCustSearch(e.target.value);
                  setShowOrderCustDropdown(true);
                }}
                onFocus={() => setShowOrderCustDropdown(true)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface border border-theme text-xs text-theme outline-none focus:border-amber-500"
              />

              {showOrderCustDropdown && orderCustSearch.trim().length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-surface border border-theme rounded-lg divide-y divide-theme shadow-lg">
                  {customers
                    .filter(
                      c =>
                        c.name.toLowerCase().includes(orderCustSearch.toLowerCase()) ||
                        c.phone.includes(orderCustSearch)
                    )
                    .slice(0, 5)
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setOrderForm(prev => ({
                            ...prev,
                            customerId: c.id,
                            customerName: c.name,
                            customerPhone: c.phone,
                            channel: c.channel,
                          }));
                          setOrderCustSearch(`${c.name} (${c.phone})`);
                          setShowOrderCustDropdown(false);
                        }}
                        className="p-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-theme">{c.name}</strong>
                          <span className="text-theme-muted font-mono ml-2">{c.phone}</span>
                        </div>
                        <span className="text-[10px] text-amber-600 font-bold">Pilih</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Nama Customer *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Customer (cth. Villa Seminyak Sanctuary)"
                  value={orderForm.customerName}
                  onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Nomor WhatsApp / Telepon *</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={orderForm.customerPhone}
                  onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Order Value / OMSET */}
              <div>
                <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                  Nilai Order (OMSET dalam Rupiah) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-theme-muted">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="cth. 4800000"
                    value={orderForm.orderValue}
                    onChange={e => setOrderForm({ ...orderForm, orderValue: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-alt border border-amber-500/40 text-xs font-black text-theme outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Channel Order</label>
                <select
                  value={orderForm.channel}
                  onChange={e => setOrderForm({ ...orderForm, channel: e.target.value as Channel })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500 cursor-pointer"
                >
                  {channels.map(ch => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Produk Cetak yang Dipesan *</label>
                <input
                  type="text"
                  required
                  list="bali-products-list"
                  placeholder="Ketik produk (cth. Buku Menu Resto Hardcover 20 pcs...)"
                  value={orderForm.product}
                  onChange={e => setOrderForm({ ...orderForm, product: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500"
                />
              </div>

              {/* Closer Hunter */}
              <div>
                <label className="block text-xs font-bold text-theme mb-1">Hunter Closer</label>
                <select
                  value={orderForm.hunterId}
                  onChange={e => setOrderForm({ ...orderForm, hunterId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500 cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datalist for fast suggestion */}
            <datalist id="bali-products-list">
              {BALI_PRINTING_PRODUCTS.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>

            <div>
              <label className="block text-xs font-bold text-theme mb-1">Catatan Order / Spesifikasi</label>
              <textarea
                rows={2}
                placeholder="cth. 20 pcs buku menu cetak UV spot hardcover, DP transfer BCA lunas..."
                value={orderForm.notes}
                onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-3">
              {currentUser.role === 'VIEWER' ? (
                <div className="px-4 py-2.5 rounded-xl bg-surface-alt border border-theme text-theme-muted text-xs font-bold inline-flex items-center gap-2">
                  <span>🔒 Pencatatan order dinonaktifkan untuk Akun Viewer</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Order Closing (+50 XP & +BPC)</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* RECENT HUNT ACTIVITY FEED */}
      <div className="card-theme p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-theme">AKTIVITAS HUNT LOG TERBARU</h3>
            <p className="text-xs text-theme-muted">Catatan lead & transaksi terkini dari tim Web Order</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {leads.slice(0, 6).map(lead => (
            <div
              key={lead.id}
              className="p-3 rounded-xl bg-surface-alt border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                    lead.status === 'Order'
                      ? 'bg-emerald-500'
                      : lead.status === 'Follow-up'
                      ? 'bg-amber-500'
                      : lead.status === 'Quotation'
                      ? 'bg-sky-500'
                      : 'bg-slate-400'
                  }`}
                >
                  {lead.status === 'Order' ? '💰' : '🏹'}
                </div>
                <div>
                  <div className="font-extrabold text-theme flex items-center gap-2">
                    <span>{lead.customerName}</span>
                    <span className="text-[10px] text-theme-muted font-normal">({lead.channel})</span>
                  </div>
                  <div className="text-[11px] text-theme-muted mt-0.5">
                    {lead.product} • Oleh <strong className="text-theme font-semibold">{lead.hunterName}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    lead.status === 'Order'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : lead.status === 'Follow-up'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                  }`}
                >
                  {lead.status}
                </span>
                <span className="text-[10px] text-theme-muted font-mono">
                  {new Date(lead.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
