import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Eye,
  ShoppingBag,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { customerService, CustomerFilters } from '../../services/customerService';
import { Customer } from '../../types';
import { usePermission } from '../../hooks/usePermission';

export const CustomersPage: React.FC = () => {
  const { canViewCustomers, canUpdateCustomers } = usePermission();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchInput, setSearchInput] = useState('');
  const [accountType, setAccountType] = useState<'all' | 'registered' | 'guest'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'orders_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: CustomerFilters = {
        search: searchInput,
        accountType,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      const { data, count, error: err } = await customerService.getCustomers(filters);
      if (err) throw err;
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger l’annuaire des clients.');
    } finally {
      setLoading(false);
    }
  }, [searchInput, accountType, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const resetFilters = () => {
    setSearchInput('');
    setAccountType('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#18281B] font-normal tracking-tight">
            Customers
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#6E736B] mt-1">
            View and manage customer profiles, acquisition channels, and order histories
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-3.5 py-2 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-[#18281B] font-sans text-xs font-medium">
            <span className="text-[#2D6636] font-semibold">{totalCount}</span> {totalCount > 1 ? 'Customers' : 'Customer'}
          </div>
        </div>
      </div>

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
              placeholder="Search by customer name, phone, or email..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs text-[#18281B] placeholder:text-[#8E968C] focus:outline-none focus:ring-1 focus:ring-[#18281B] transition-colors"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#FAF7EB]/60 border border-[#DED6BE] rounded-lg px-2.5 py-1.5 text-xs text-[#18281B]">
              <Filter className="w-3.5 h-3.5 text-[#5A6258]" />
              <span className="text-[11px] text-[#6E736B]">Type:</span>
              <select
                value={accountType}
                onChange={(e) => {
                  setAccountType(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs text-[#18281B] focus:outline-none cursor-pointer pr-2 font-medium"
              >
                <option value="all">All Profiles</option>
                <option value="registered">Registered Accounts</option>
                <option value="guest">Guest Customers</option>
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
                <option value="full_name_asc">Name: A to Z</option>
                <option value="full_name_desc">Name: Z to A</option>
                <option value="orders_count_desc">Orders Count</option>
              </select>
            </div>

            {(searchInput || accountType !== 'all') && (
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
      </div>

      {/* Customers Table View */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-[#FFFFFF] border border-[#DED6BE] rounded-xl shadow-2xs">
          <div className="w-8 h-8 mx-auto border-2 border-[#18281B] border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-xs text-[#6E736B]">
            Loading customers...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-900 text-center space-y-3">
          <AlertCircle className="w-6 h-6 mx-auto text-red-700" />
          <p className="font-medium text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchCustomers}
            className="px-4 py-2 bg-red-900 text-white text-xs font-medium rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="border border-[#DED6BE] bg-[#FFFFFF] rounded-xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF7EB] rounded-full flex items-center justify-center text-[#2D6636]">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-base font-medium text-[#18281B]">
              No Customers Found
            </h3>
            <p className="font-sans text-xs text-[#6E736B] max-w-md mx-auto">
              {searchInput || accountType !== 'all'
                ? 'No customer profiles match your current search and filter criteria.'
                : 'No customer accounts recorded yet.'}
            </p>
          </div>
          {(searchInput || accountType !== 'all') && (
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
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {customers.map((c) => {
                  const isRegistered = Boolean(c.user_id);
                  return (
                    <tr key={c.id} className="hover:bg-[#FAF7EB]/50 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-5">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="font-medium text-xs sm:text-sm text-[#18281B] hover:text-[#2D6636] transition-colors"
                        >
                          {c.full_name}
                        </Link>
                        <div className="font-mono text-[10px] text-[#7A8278]">
                          ID: {c.id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-[#5A6258]">
                        <div className="space-y-0.5">
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-xs text-[#18281B]">
                              <Mail className="w-3 h-3 text-[#7A8278]" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#7A8278]">
                              <Phone className="w-3 h-3 text-[#7A8278]" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {!c.email && !c.phone && <span className="text-[#A4ACA2] italic text-[11px]">Not provided</span>}
                        </div>
                      </td>

                      {/* Account Type */}
                      <td className="py-3.5 px-4">
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-medium">
                            <UserCheck className="w-3 h-3 text-emerald-700" />
                            <span>Registered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7EB] text-[#7A8278] border border-[#DED6BE] text-[10.5px] font-medium">
                            <UserX className="w-3 h-3 text-[#7A8278]" />
                            <span>Guest</span>
                          </span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center font-medium text-[#18281B]">
                        <span className="inline-block px-2 py-0.5 bg-[#FAF7EB] border border-[#EBE4D2] rounded-md text-[11px] font-medium text-[#3D453E]">
                          {c.total_orders || 0}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-medium text-xs sm:text-sm text-[#18281B]">
                          ৳{Number(c.total_spent || 0).toLocaleString('en-US')}
                        </span>
                      </td>

                      {/* Last Order / Registered At */}
                      <td className="py-3.5 px-4 text-[#5A6258] whitespace-nowrap">
                        {c.last_order_at ? (
                          <div>
                            <div className="text-xs font-medium text-[#18281B]">
                              {new Date(c.last_order_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-[#7A8278]">Last purchase</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#7A8278]">
                            Joined {new Date(c.created_at).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors"
                          title="View Customer Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
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
                Showing {customers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} customers
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
    </div>
  );
};
