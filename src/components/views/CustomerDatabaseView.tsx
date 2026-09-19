import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  FileText,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Download,
  Mail,
  Calendar,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Customer, Channel, CustomerStatus, Lead, Order } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { formatWitaDateTime, getWitaDateString } from '../../utils/witaTime';
import { EditOrderRevenueModal } from '../modals/EditOrderRevenueModal';

interface CustomerDatabaseViewProps {
  onNavigateToOrder?: (customerId: string) => void;
}

export const CustomerDatabaseView: React.FC<CustomerDatabaseViewProps> = ({
  onNavigateToOrder,
}) => {
  const { customers, leads, orders, addCustomer, updateCustomer, deleteCustomer, updateOrderRevenue } = useData();
  const { users, currentUser } = useAuth();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'lastActive' | 'omset' | 'orders' | 'name' | 'created'>('lastActive');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Drawers
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    channel: 'WhatsApp' as Channel,
    notes: '',
    status: 'Lead' as CustomerStatus,
    assignedHunterId: currentUser?.id || 'user_csonline',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Aggregate Customer Stats
  const customerStats = useMemo(() => {
    const total = customers.length;
    const repeatCount = customers.filter(c => c.totalOrdersCount >= 2 || c.status === 'Repeat Customer').length;
    const activeCount = customers.filter(c => c.totalOrdersCount === 1 || c.status === 'Active Customer').length;
    const leadCount = customers.filter(c => c.totalOrdersCount === 0 && c.status !== 'Inactive').length;
    const totalLtv = customers.reduce((sum, c) => sum + c.totalOmset, 0);
    const avgLtv = total > 0 ? Math.round(totalLtv / total) : 0;

    return { total, repeatCount, activeCount, leadCount, totalLtv, avgLtv };
  }, [customers]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    const cleanSearchDigits = cleanSearch.replace(/[^0-9]/g, '');

    return customers
      .filter(customer => {
        // Search matching
        if (cleanSearch) {
          const matchName = customer.name.toLowerCase().includes(cleanSearch);
          // Hanya cek kecocokan nomor telepon kalau search term-nya beneran
          // mengandung angka — kalau tidak, ".includes('')" selalu true dan
          // bikin filter ini nggak pernah nyaring apa-apa.
          const matchPhone = cleanSearchDigits.length > 0 && customer.phone.replace(/[^0-9]/g, '').includes(cleanSearchDigits);
          const matchId = customer.id.toLowerCase().includes(cleanSearch);
          const matchNotes = customer.notes?.toLowerCase().includes(cleanSearch);
          if (!matchName && !matchPhone && !matchId && !matchNotes) return false;
        }

        // Status matching
        if (selectedStatus !== 'ALL') {
          const custStatus = customer.status || (customer.totalOrdersCount >= 2 ? 'Repeat Customer' : customer.totalOrdersCount === 1 ? 'Active Customer' : 'Lead');
          if (custStatus !== selectedStatus) return false;
        }

        // Channel matching
        if (selectedChannel !== 'ALL') {
          if (customer.channel !== selectedChannel) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'lastActive') {
          comparison = new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
        } else if (sortBy === 'omset') {
          comparison = b.totalOmset - a.totalOmset;
        } else if (sortBy === 'orders') {
          comparison = b.totalOrdersCount - a.totalOrdersCount;
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'created') {
          comparison = new Date(b.firstLeadAt).getTime() - new Date(a.firstLeadAt).getTime();
        }

        return sortOrder === 'desc' ? comparison : -comparison;
      });
  }, [customers, searchTerm, selectedStatus, selectedChannel, sortBy, sortOrder]);

  // Customer History Lookup
  const customerLeads = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    return leads.filter(
      l => l.customerId === selectedCustomer.id || (cleanPhone && l.customerPhone.replace(/[^0-9]/g, '') === cleanPhone)
    );
  }, [leads, selectedCustomer]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    return orders.filter(
      o => o.customerId === selectedCustomer.id || (cleanPhone && o.customerPhone.replace(/[^0-9]/g, '') === cleanPhone)
    );
  }, [orders, selectedCustomer]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      channel: 'WhatsApp',
      notes: '',
      status: 'Lead',
      assignedHunterId: currentUser?.id || 'user_csonline',
    });
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      channel: customer.channel,
      notes: customer.notes || '',
      status: customer.status || (customer.totalOrdersCount >= 2 ? 'Repeat Customer' : customer.totalOrdersCount === 1 ? 'Active Customer' : 'Lead'),
      assignedHunterId: customer.assignedHunterId || currentUser?.id || 'user_csonline',
    });
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama customer wajib diisi!');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon / WhatsApp wajib diisi!');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        channel: formData.channel,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        assignedHunterId: formData.assignedHunterId,
      });
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          channel: formData.channel,
          notes: formData.notes.trim() || undefined,
          status: formData.status,
          assignedHunterId: formData.assignedHunterId,
        } : null);
      }
    } else {
      const res = addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        channel: formData.channel,
        notes: formData.notes.trim() || undefined,
        assignedHunterId: formData.assignedHunterId,
      });

      if (res.isExisting) {
        alert('Nomor telepon customer ini sudah terdaftar sebelumnya. Data customer telah diperbarui!');
      }
    }

    setIsAddEditModalOpen(false);
  };

  const handleOpenDetailDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomerConfirm = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
        setIsDetailDrawerOpen(false);
      }
      setCustomerToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Nama Customer', 'Telepon', 'Email', 'Channel', 'Status', 'Total Order', 'Total Omset (IDR)', 'Terakhir Aktif', 'Catatan'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      c.channel,
      c.status || (c.totalOrdersCount >= 2 ? 'Repeat Customer' : c.totalOrdersCount === 1 ? 'Active Customer' : 'Lead'),
      c.totalOrdersCount,
      c.totalOmset,
      `"${formatWitaDateTime(c.lastActiveAt)}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BPC_Data_Customer_${getWitaDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (customer: Customer) => {
    const status = customer.status || (customer.totalOrdersCount >= 2 ? 'Repeat Customer' : customer.totalOrdersCount === 1 ? 'Active Customer' : 'Lead');

    switch (status) {
      case 'Repeat Customer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Repeat Customer
          </span>
        );
      case 'Active Customer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Active Customer
          </span>
        );
      case 'Lead':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
            <UserCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            Lead Baru
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getChannelBadge = (channel: Channel) => {
    const colors: Record<Channel, string> = {
      WhatsApp: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      Website: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      Tokopedia: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
      Shopee: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[channel] || 'bg-slate-100 text-slate-700'}`}>
        {channel}
      </span>
    );
  };

  return (
    <div id="customer-database-view" className="space-y-6 pb-12">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-theme shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-theme tracking-tight flex items-center gap-2">
                Customer Index & CRM HQ
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold border border-orange-300 dark:border-orange-800">
                  {customers.length} Terdaftar
                </span>
                {currentUser.role === 'VIEWER' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800">
                    Read-Only
                  </span>
                )}
              </h1>
              <p className="text-sm text-theme-muted">
                Pusat indeks data pelanggan terpadu Bali Printing Center. Riwayat leads, closing order, LTV, dan kontak langsung.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'ADMIN' && (
            <button
              id="btn-export-csv"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border border-theme bg-surface hover:bg-surface-alt text-theme transition-colors cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-theme-muted" />
              Export CSV
            </button>
          )}
          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-add-customer-main"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Customer
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-theme shadow-sm">
          <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Total Customer</span>
          <div className="text-2xl font-black text-theme mt-1">{customerStats.total}</div>
          <span className="text-xs text-theme-muted mt-1 block">Pelanggan terdata</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-theme shadow-sm">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Repeat Customer</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{customerStats.repeatCount}</div>
          <span className="text-xs text-theme-muted mt-1 block">≥ 2 Order sukses</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-theme shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Customer</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{customerStats.activeCount}</div>
          <span className="text-xs text-theme-muted mt-1 block">1 Order closing</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-theme shadow-sm">
          <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Total Revenue / LTV</span>
          <div className="text-xl md:text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {formatRupiah(customerStats.totalLtv)}
          </div>
          <span className="text-xs text-theme-muted mt-1 block">Total omset keseluruhan</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-theme shadow-sm col-span-2 md:col-span-1">
          <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Avg. LTV / Customer</span>
          <div className="text-xl md:text-2xl font-black text-theme mt-1">
            {formatRupiah(customerStats.avgLtv)}
          </div>
          <span className="text-xs text-theme-muted mt-1 block">Rata-rata nilai pelanggan</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-surface p-4 rounded-2xl border border-theme shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              id="input-customer-search"
              type="text"
              placeholder="Cari nama pelanggan, nomor WhatsApp / telepon, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted shrink-0" />
            <select
              id="select-customer-status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="py-2 px-3 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="Repeat Customer">Repeat Customer (≥2 Order)</option>
              <option value="Active Customer">Active Customer (1 Order)</option>
              <option value="Lead">Lead Baru (Belum Order)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Channel Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-customer-channel"
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="py-2 px-3 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
            >
              <option value="ALL">Semua Channel</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Shopee">Shopee</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-customer-sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="py-2 px-3 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
            >
              <option value="lastActive-desc">Terakhir Aktif (Terbaru)</option>
              <option value="lastActive-asc">Terakhir Aktif (Terlama)</option>
              <option value="omset-desc">Total Omset / LTV (Tertinggi)</option>
              <option value="omset-asc">Total Omset / LTV (Terendah)</option>
              <option value="orders-desc">Total Order (Terbanyak)</option>
              <option value="orders-asc">Total Order (Tersedikit)</option>
              <option value="created-desc">Customer Terdaftar Baru (Newest)</option>
              <option value="created-asc">Customer Terdaftar Lama (Oldest)</option>
              <option value="name-asc">Nama Customer (A - Z)</option>
              <option value="name-desc">Nama Customer (Z - A)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags count */}
        <div className="flex items-center justify-between text-xs text-theme-muted pt-1 border-t border-theme">
          <span>Menampilkan <strong className="text-theme font-bold">{filteredCustomers.length}</strong> dari {customers.length} data customer</span>
          {(searchTerm || selectedStatus !== 'ALL' || selectedChannel !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('ALL');
                setSelectedChannel('ALL');
              }}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-surface rounded-2xl border border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-theme bg-surface-alt text-theme-muted text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Kontak & WA</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Interaksi</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Value (Omset)</th>
                <th className="py-3 px-4">Terakhir Aktif</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-theme-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-theme">Tidak ada data customer yang cocok.</p>
                      <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`;
                  const assignedHunter = users.find(u => u.id === customer.assignedHunterId);

                  return (
                    <tr
                      key={customer.id}
                      id={`customer-row-${customer.id}`}
                      className="hover:bg-surface-alt/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetailDrawer(customer)}
                    >
                      {/* Customer Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-theme group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                              {customer.name}
                            </span>
                            <span className="text-[11px] text-theme-muted block font-mono">
                              {customer.id} {assignedHunter ? `\u2022 CS: ${assignedHunter.displayName.split(' ')[0]}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Direct WA link */}
                      <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-theme">{customer.phone}</span>
                          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors" title="Chat via WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                        {customer.email && (
                          <span className="text-[11px] text-theme-muted truncate block max-w-[160px]">
                            {customer.email}
                          </span>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4">
                        {getChannelBadge(customer.channel)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(customer)}
                      </td>

                      {/* Leads Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block font-semibold text-theme px-2 py-0.5 bg-surface-alt rounded-md text-xs">
                          {leads.filter(l => l.customerId === customer.id || (cleanPhone && l.customerPhone.replace(/[^0-9]/g, '') === cleanPhone)).length}x
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded-md text-xs ${
                          customer.totalOrdersCount >= 2
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-black'
                            : customer.totalOrdersCount === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'text-theme-muted bg-surface-alt'
                        }`}>
                          {customer.totalOrdersCount}
                        </span>
                      </td>

                      {/* Lifetime Value */}
                      <td className="py-3.5 px-4 text-right font-black text-theme">
                        {customer.totalOmset > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                            {formatRupiah(customer.totalOmset)}
                          </span>
                        ) : (
                          <span className="text-theme-muted font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-xs text-theme-muted whitespace-nowrap">
                        {formatWitaDateTime(customer.lastActiveAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-view-customer-${customer.id}`}
                            onClick={() => handleOpenDetailDrawer(customer)}
                            className="px-2.5 py-1 text-xs font-bold bg-surface-alt hover:bg-orange-500 hover:text-white rounded-lg border border-theme transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                          {currentUser.role !== 'VIEWER' && (
                            <>
                              <button
                                id={`btn-edit-customer-${customer.id}`}
                                onClick={() => handleOpenEditModal(customer)}
                                className="p-1 text-theme-muted hover:text-theme rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Customer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-customer-${customer.id}`}
                                onClick={() => handleOpenDeleteModal(customer)}
                                className="p-1 text-rose-500/70 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {isDetailDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            id="customer-detail-drawer"
            className="w-full max-w-2xl bg-surface h-full shadow-2xl flex flex-col border-l border-theme overflow-hidden animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-theme flex items-start justify-between bg-surface-alt/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-theme">{selectedCustomer.name}</h2>
                    {getStatusBadge(selectedCustomer)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-theme-muted mt-0.5">
                    <span>ID: <code className="font-mono">{selectedCustomer.id}</code></span>
                    <span>•</span>
                    <span>Asal: {getChannelBadge(selectedCustomer.channel)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser.role !== 'VIEWER' && (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(selectedCustomer)}
                      className="p-2 text-theme-muted hover:text-theme rounded-xl border border-theme bg-surface hover:bg-surface-alt transition-colors cursor-pointer"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(selectedCustomer)}
                      className="p-2 text-rose-500 hover:text-rose-600 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 transition-colors cursor-pointer"
                      title="Hapus Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-2 text-theme-muted hover:text-theme rounded-xl border border-theme bg-surface hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Actions Card */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + selectedCustomer.phone.replace(/[^0-9]/g, '').slice(1) : selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi via WhatsApp
                </a>

                {currentUser.role !== 'VIEWER' && onNavigateToOrder && (
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      onNavigateToOrder(selectedCustomer.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Catat Order Baru
                  </button>
                )}
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-surface-alt rounded-xl border border-theme">
                  <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Total LTV Omset</span>
                  <span className="text-lg font-black text-orange-600 dark:text-orange-400 block mt-1">
                    {formatRupiah(selectedCustomer.totalOmset)}
                  </span>
                </div>
                <div className="p-3.5 bg-surface-alt rounded-xl border border-theme">
                  <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Total Orders</span>
                  <span className="text-lg font-black text-theme block mt-1">
                    {selectedCustomer.totalOrdersCount} Transaksi
                  </span>
                </div>
                <div className="p-3.5 bg-surface-alt rounded-xl border border-theme">
                  <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block">Total Interaksi</span>
                  <span className="text-lg font-black text-theme block mt-1">
                    {customerLeads.length} Leads
                  </span>
                </div>
              </div>

              {/* Customer Contact & Info Details */}
              <div className="bg-surface p-4 rounded-xl border border-theme space-y-2.5 text-sm">
                <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider">Informasi Kontak & Detail</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-theme-muted block">Nomor WhatsApp:</span>
                    <span className="font-bold text-theme font-mono">{selectedCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Email:</span>
                    <span className="font-semibold text-theme">{selectedCustomer.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Pertama Kontak:</span>
                    <span className="font-semibold text-theme">{formatWitaDateTime(selectedCustomer.firstLeadAt)}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted block">Terakhir Aktif:</span>
                    <span className="font-semibold text-theme">{formatWitaDateTime(selectedCustomer.lastActiveAt)}</span>
                  </div>
                </div>
                {selectedCustomer.notes && (
                  <div className="pt-2 border-t border-theme">
                    <span className="text-xs text-theme-muted block font-semibold mb-1">Catatan Profil:</span>
                    <p className="text-xs text-theme bg-surface-alt p-2.5 rounded-lg border border-theme">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-theme flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    Riwayat Order Sukses ({customerOrders.length})
                  </h3>
                  <span className="text-xs text-theme-muted font-bold">
                    Subtotal: {formatRupiah(customerOrders.reduce((sum, o) => sum + o.orderValue, 0))}
                  </span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="p-6 bg-surface-alt rounded-xl border border-theme text-center text-theme-muted text-xs">
                    Belum ada order sukses yang tercatat untuk customer ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-3.5 bg-surface-alt rounded-xl border border-theme hover:border-orange-300 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-theme">{order.product}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                              Lunas / Sukses
                            </span>
                          </div>
                          <span className="text-theme-muted block mt-0.5">
                            {formatWitaDateTime(order.orderDate)} • Closer: {order.hunterName}
                          </span>
                          {order.notes && (
                            <span className="text-theme-secondary italic mt-1 block">
                              "{order.notes}"
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2.5">
                          <div>
                            <span className="text-sm font-black text-orange-600 dark:text-orange-400 block">
                              {formatRupiah(order.orderValue)}
                            </span>
                            <span className="text-[10px] text-theme-muted font-mono">{order.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            className="p-1.5 rounded-lg text-theme-muted hover:text-amber-500 hover:bg-amber-500/10 border border-theme hover:border-amber-500/30 transition-all cursor-pointer"
                            title="Edit nominal pendapatan order ini"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leads & Follow-ups History */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-theme flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  Riwayat Leads & Interaksi ({customerLeads.length})
                </h3>

                {customerLeads.length === 0 ? (
                  <div className="p-6 bg-surface-alt rounded-xl border border-theme text-center text-theme-muted text-xs">
                    Belum ada riwayat leads tambahan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerLeads.map(lead => (
                      <div
                        key={lead.id}
                        className="p-3.5 bg-surface-alt rounded-xl border border-theme flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-theme">{lead.product}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              lead.status === 'Order'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.status === 'Follow-up'
                                ? 'bg-amber-100 text-amber-800'
                                : lead.status === 'Quotation'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                          <span className="text-theme-muted block mt-0.5">
                            {formatWitaDateTime(lead.createdAt)} • CS: {lead.hunterName}
                          </span>
                          {lead.notes && (
                            <p className="text-theme-secondary text-[11px] mt-1">
                              {lead.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-theme-muted font-mono shrink-0">{lead.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            id="modal-add-edit-customer"
            className="w-full max-w-lg bg-surface rounded-2xl border border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-theme flex items-center justify-between bg-surface-alt/50">
              <h2 className="text-lg font-black text-theme flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                {editingCustomer ? 'Edit Data Customer' : 'Tambah Customer Baru'}
              </h2>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-theme-muted hover:text-theme rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                  Nama Customer / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-customer-name"
                  type="text"
                  placeholder="Contoh: Villa Seminyak Sanctuary / Made Suparta"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                    Nomor Telepon / WA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-customer-phone"
                    type="tel"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                    Channel Asal
                  </label>
                  <select
                    id="input-customer-channel"
                    value={formData.channel}
                    onChange={e => setFormData({ ...formData, channel: e.target.value as Channel })}
                    className="w-full px-3 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Tokopedia">Tokopedia</option>
                    <option value="Shopee">Shopee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                  Email (Opsional)
                </label>
                <input
                  id="input-customer-email"
                  type="email"
                  placeholder="contact@customer.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {editingCustomer && (
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                    Status Customer
                  </label>
                  <select
                    id="input-customer-status-edit"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className="w-full px-3 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="Lead">Lead (Belum Order)</option>
                    <option value="Active Customer">Active Customer (1 Order)</option>
                    <option value="Repeat Customer">Repeat Customer (≥ 2 Order)</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                  Catatan / Kebutuhan Cetak Customer
                </label>
                <textarea
                  id="input-customer-notes"
                  rows={3}
                  placeholder="Contoh: Kebutuhan cetak rutin buku menu resto & packaging box kosmetik..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-surface-alt border border-theme rounded-xl text-theme focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-theme-secondary hover:text-theme rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-customer"
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Simpan Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Customer Confirmation Modal */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            id="modal-delete-customer-confirm"
            className="w-full max-w-md bg-surface rounded-2xl border border-rose-500/40 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-theme">Hapus Data Customer?</h3>
                <p className="text-xs text-theme-muted">Tindakan ini memerlukan konfirmasi.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-theme text-xs space-y-1.5">
              <div className="font-bold text-theme flex items-center justify-between">
                <span>{customerToDelete.name}</span>
                <span className="font-mono text-[11px] text-theme-muted">#{customerToDelete.id}</span>
              </div>
              <div className="text-theme-muted font-mono">{customerToDelete.phone} • {customerToDelete.channel}</div>
              <div className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold pt-1 border-t border-theme/60">
                Total Omset: {formatRupiah(customerToDelete.totalOmset)} • {customerToDelete.totalOrdersCount} Order
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              <p className="font-bold">⚠️ Perhatian Keamanan Data:</p>
              <p className="mt-1 leading-relaxed text-[11px]">
                Menghapus profil customer ini tidak akan merusak riwayat transaksi dan data lead yang telah tercatat sebelumnya.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomerToDelete(null);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-theme-muted hover:text-theme bg-surface-alt rounded-xl border border-theme cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-customer"
                onClick={handleDeleteCustomerConfirm}
                className="px-4 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                Ya, Hapus Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Nominal Pendapatan Order */}
      <EditOrderRevenueModal
        order={editingOrder}
        isOpen={Boolean(editingOrder)}
        onClose={() => setEditingOrder(null)}
        onSave={updateOrderRevenue}
      />
    </div>
  );
};