import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  CreditCard,
  Truck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  orderService,
  OrderFilters,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { canViewOrders, canUpdateOrders } = usePermission();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedDatePreset, setSelectedDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'order_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Quick Status Change Modal
  const [quickStatusOrder, setQuickStatusOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: OrderFilters = {
        search: searchInput,
        order_status: selectedStatus,
        payment_status: selectedPaymentStatus,
        datePreset: selectedDatePreset,
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      const { data, count, error: err } = await orderService.getOrders(filters);
      if (err) throw err;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le registre des commandes.');
    } finally {
      setLoading(false);
    }
  }, [
    searchInput,
    selectedStatus,
    selectedPaymentStatus,
    selectedDatePreset,
    customStartDate,
    customEndDate,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  useEffect(() => {
    fetchOrders();

    // Realtime channel for order updates
    const channel = supabase
      .channel('orders-live-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const resetFilters = () => {
    setSearchInput('');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSelectedDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleQuickStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStatusOrder || !canUpdateOrders) return;

    setUpdatingStatus(true);
    try {
      const { success, error: updErr } = await orderService.updateOrderStatus({
        orderId: quickStatusOrder.id,
        newStatus: targetStatus,
        note: statusNote || undefined,
        adminUserId: user?.id,
      });

      if (!success && updErr) throw updErr;

      setFeedback({
        type: 'success',
        message: `Statut de la commande #${quickStatusOrder.order_number} mis à jour vers "${targetStatus}".`,
      });
      setQuickStatusOrder(null);
      setStatusNote('');
      fetchOrders();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la mise à jour du statut.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header matching ELIF Design System */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#18281B] font-normal tracking-tight">
            Orders
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#6E736B] mt-1">
            Manage customer orders, track shipments, and update order statuses
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-3.5 py-2 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-[#18281B] font-sans text-xs font-medium">
            <span className="text-[#2D6636] font-semibold">{totalCount}</span> {totalCount > 1 ? 'Orders' : 'Order'}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 border rounded-xl flex items-start gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-sans">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] underline ml-2 cursor-pointer font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-4 shadow-2xs space-y-3 font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A8278] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order #, customer name, phone..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs text-[#18281B] placeholder:text-[#8E968C] focus:outline-none focus:ring-1 focus:ring-[#18281B] transition-colors"
            />
          </form>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-lg px-2.5 py-1.5 text-xs text-[#18281B]">
              <Filter className="w-3.5 h-3.5 text-[#5A6258]" />
              <span className="text-[11px] text-[#6E736B]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs text-[#18281B] focus:outline-none cursor-pointer pr-2 font-medium"
              >
                <option value="all">All Status</option>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-lg px-2.5 py-1.5 text-xs text-[#18281B]">
              <CreditCard className="w-3.5 h-3.5 text-[#5A6258]" />
              <span className="text-[11px] text-[#6E736B]">Payment:</span>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs text-[#18281B] focus:outline-none cursor-pointer pr-2 font-medium"
              >
                <option value="all">All Payments</option>
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-lg px-2.5 py-1.5 text-xs text-[#18281B]">
              <Calendar className="w-3.5 h-3.5 text-[#5A6258]" />
              <select
                value={selectedDatePreset}
                onChange={(e) => {
                  setSelectedDatePreset(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs text-[#18281B] focus:outline-none cursor-pointer pr-2 font-medium"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-lg px-2.5 py-1.5 text-xs text-[#18281B]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5A6258]" />
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs text-[#18281B] focus:outline-none cursor-pointer pr-2 font-medium"
              >
                <option value="created_at_desc">Newest First</option>
                <option value="created_at_asc">Oldest First</option>
                <option value="total_amount_desc">Total: High to Low</option>
                <option value="total_amount_asc">Total: Low to High</option>
                <option value="order_number_asc">Order #</option>
              </select>
            </div>

            {(searchInput || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' || selectedDatePreset !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 text-xs text-[#7A8278] hover:text-[#18281B] underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Custom date range if selected */}
        {selectedDatePreset === 'custom' && (
          <div className="pt-2 border-t border-[#EBE4D2] flex items-center gap-3 text-xs">
            <span className="text-[#6E736B]">Custom Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-md text-xs text-[#18281B]"
              />
              <span className="text-[#6E736B]">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-md text-xs text-[#18281B]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table View */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-[#FFFFFF] border border-[#DED6BE] rounded-xl shadow-2xs">
          <div className="w-8 h-8 mx-auto border-2 border-[#18281B] border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-xs text-[#6E736B]">
            Loading orders...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-900 text-center space-y-3">
          <AlertCircle className="w-6 h-6 mx-auto text-red-700" />
          <p className="font-medium text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-900 text-white text-xs font-medium rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-[#DED6BE] bg-[#FFFFFF] rounded-xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF7EB] rounded-full flex items-center justify-center text-[#2D6636]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-base font-medium text-[#18281B]">
              No Orders Found
            </h3>
            <p className="font-sans text-xs text-[#6E736B] max-w-md mx-auto">
              {searchInput || selectedStatus !== 'all' || selectedPaymentStatus !== 'all'
                ? 'No orders match your current search and filter criteria.'
                : 'No orders have been recorded in the database yet.'}
            </p>
          </div>
          {(searchInput || selectedStatus !== 'all' || selectedPaymentStatus !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#18281B] text-[#FFFFFF] rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
            >
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-[#EBE4D2] text-[11px] font-sans font-medium text-[#7A8278] uppercase tracking-wider bg-[#FAF7EB]/40">
                  <th className="py-3 px-5">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {orders.map((ord) => {
                  const statusConfig = ORDER_STATUS_OPTIONS.find((s) => s.value === ord.order_status) || {
                    label: ord.order_status,
                    colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
                  };
                  const paymentConfig = PAYMENT_STATUS_OPTIONS.find((p) => p.value === ord.payment_status) || {
                    label: ord.payment_status,
                    colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
                  };
                  const primaryShipment = ord.shipments?.[0];
                  const primaryAddress = ord.order_addresses?.[0];
                  const itemsCount = (ord.order_items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF7EB]/50 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-5">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="font-medium text-xs sm:text-sm text-[#18281B] hover:text-[#2D6636] transition-colors"
                        >
                          #{ord.order_number}
                        </Link>
                        {ord.customer_notes && (
                          <div className="text-[10.5px] text-[#7A8278] truncate max-w-[150px]" title={ord.customer_notes}>
                            Note: {ord.customer_notes}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#5A6258] whitespace-nowrap">
                        <div className="font-medium text-[#18281B]">{new Date(ord.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px] text-[#7A8278]">{new Date(ord.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#18281B]">
                          {ord.customers?.full_name || primaryAddress?.recipient_name || 'Guest Customer'}
                        </div>
                        <div className="text-[11px] text-[#7A8278]">
                          {ord.customers?.phone || primaryAddress?.phone || ord.customers?.email || '—'}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-center text-[#5A6258]">
                        <span className="inline-block px-2 py-0.5 bg-[#FAF7EB] border border-[#EBE4D2] rounded-md text-[11px] font-medium text-[#3D453E]">
                          {itemsCount} {itemsCount > 1 ? 'items' : 'item'}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : ord.payment_status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {ord.payment_status === 'paid' ? 'Paid' : ord.payment_status === 'pending' ? 'Pending' : ord.payment_status}
                        </span>
                        {ord.payment_method && (
                          <div className="text-[10px] text-[#7A8278] mt-0.5 uppercase tracking-wider">
                            {ord.payment_method}
                          </div>
                        )}
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${
                            ord.order_status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : ord.order_status === 'shipped'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : ord.order_status === 'confirmed' || ord.order_status === 'processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : ord.order_status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {ord.order_status.charAt(0).toUpperCase() + ord.order_status.slice(1)}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-medium text-xs sm:text-sm text-[#18281B]">
                          ৳{Number(ord.total_amount || 0).toLocaleString('en-US')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canUpdateOrders && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickStatusOrder(ord);
                                setTargetStatus(ord.order_status as OrderStatus);
                                setStatusNote('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium bg-[#FAF7EB] hover:bg-[#EFE9D7] border border-[#DED6BE] rounded-md text-[#18281B] transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              Status
                            </button>
                          )}
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors"
                            title="View Order Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#FAF7EB]/30 border-t border-[#EBE4D2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E736B]">
              <div>
                Showing {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-md text-[#18281B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF7EB] transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-medium text-[#18281B]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-md text-[#18281B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF7EB] transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Status Update Modal */}
      {quickStatusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18281B]/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-sans">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#2D6636] font-semibold">
                Status Update
              </span>
              <h3 className="font-serif text-xl text-[#18281B] font-normal tracking-tight mt-0.5">
                Order #{quickStatusOrder.order_number}
              </h3>
              <p className="text-xs text-[#6E736B] mt-1">
                Current status: <span className="font-medium text-[#18281B] capitalize">{quickStatusOrder.order_status}</span>
              </p>
            </div>

            <form onSubmit={handleQuickStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#18281B] mb-1.5">
                  New Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B] cursor-pointer font-medium"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18281B] mb-1.5">
                  Internal Note (recorded in order history)
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Package dispatched via express courier..."
                  className="w-full px-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE4D2]">
                <button
                  type="button"
                  onClick={() => setQuickStatusOrder(null)}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-transparent text-[#6E736B] hover:text-[#18281B] text-xs font-medium rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-[#18281B] hover:bg-[#2D4B36] text-[#FFFFFF] text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  {updatingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
