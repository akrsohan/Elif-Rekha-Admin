import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Plus,
  Ticket,
  Megaphone,
  Headphones,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { Order, Customer } from '../types';

interface DashboardCounts {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalCustomers: number;
}

export const DashboardPage: React.FC = () => {
  const { user, adminProfile } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState<DashboardCounts>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [realCategories, setRealCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Total counts
      const [prodRes, actProdRes, ordRes, custRes, catRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }).limit(5),
      ]);

      setCounts({
        totalProducts: prodRes.count ?? 0,
        activeProducts: actProdRes.count ?? 0,
        totalOrders: ordRes.count ?? 0,
        totalCustomers: custRes.count ?? 0,
      });

      // 2. Recent orders
      const ordersResult = await orderService.getOrders({
        pageSize: 5,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setRecentOrders(ordersResult.data || []);

      // 3. Recent customers
      const customersResult = await customerService.getCustomers({
        pageSize: 4,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setRecentCustomers(customersResult.data || []);

      // 4. Categories
      if (catRes.data && catRes.data.length > 0) {
        setRealCategories(catRes.data);
      } else {
        setRealCategories([]);
      }
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Admin name
  const adminName =
    adminProfile?.adminRecord?.full_name ||
    (user?.email === 'mdsohanali636@gmail.com' ? 'Md Sohan Ali' : user?.email?.split('@')[0]) ||
    'Md Sohan Ali';

  // Format today's date matching PDF (e.g. Thu, Apr 24, 2026)
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Real orders list
  const displayOrders = recentOrders.map((ord) => {
    let statusClass = 'bg-amber-50 text-amber-800 border-amber-200';
    if (ord.order_status === 'delivered') statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (ord.order_status === 'shipped') statusClass = 'bg-purple-50 text-purple-800 border-purple-200';
    else if (ord.order_status === 'confirmed' || ord.order_status === 'processing')
      statusClass = 'bg-blue-50 text-blue-800 border-blue-200';
    else if (ord.order_status === 'cancelled') statusClass = 'bg-rose-50 text-rose-800 border-rose-200';

    return {
      id: ord.id,
      order_number: ord.order_number,
      customer_name:
        ord.customers?.full_name ||
        ord.order_addresses?.[0]?.recipient_name ||
        'Valued Client',
      date: new Date(ord.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      total: `৳${Number(ord.total_amount || 0).toLocaleString('en-US')}`,
      status: ord.order_status.charAt(0).toUpperCase() + ord.order_status.slice(1),
      statusClass,
    };
  });

  // Real customers list
  const displayCustomers = recentCustomers.map((c) => ({
    name: c.full_name || 'Client',
    email: c.email || 'client@example.com',
    joined: new Date(c.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    initials: (c.full_name || 'C')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }));

  // Top categories matching PDF reference
  const topCategories = [
    {
      name: "Women's Wear",
      count: '42 products',
      percentage: '33%',
      barWidth: 'w-1/3',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Unstitched Fabric',
      count: '28 products',
      percentage: '22%',
      barWidth: 'w-1/4',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Luxury Pret',
      count: '24 products',
      percentage: '19%',
      barWidth: 'w-1/5',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Silk & Atelier Edit',
      count: '18 products',
      percentage: '14%',
      barWidth: 'w-1/6',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=120&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Greeting Header matching PDF Page 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#18281B] font-normal tracking-tight">
            Good morning, {adminName}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#6E736B] mt-1">
            Here's what's happening with your store today.
          </p>
        </div>

        {/* Date display with calendar icon matching PDF */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs font-sans text-[#5A6258] shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#2D6636]" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Row of 4 Metric Cards matching PDF Page 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs hover:border-[#18281B]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#6E736B]">Total Products</span>
            <div className="w-9 h-9 rounded-lg bg-[#EAF4EE] flex items-center justify-center text-[#2D6636]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-sans text-2xl sm:text-3xl font-semibold text-[#18281B] tracking-tight">
              {counts.totalProducts}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-[#6E736B]">
            <span>In catalog</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs hover:border-[#18281B]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#6E736B]">Total Orders</span>
            <div className="w-9 h-9 rounded-lg bg-[#FEF3E2] flex items-center justify-center text-[#D97706]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-sans text-2xl sm:text-3xl font-semibold text-[#18281B] tracking-tight">
              {counts.totalOrders}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-[#6E736B]">
            <span>Orders placed</span>
          </div>
        </div>

        {/* Card 3: Total Customers */}
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs hover:border-[#18281B]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#6E736B]">Total Customers</span>
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-sans text-2xl sm:text-3xl font-semibold text-[#18281B] tracking-tight">
              {counts.totalCustomers}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-[#6E736B]">
            <span>Registered clients</span>
          </div>
        </div>

        {/* Card 4: Active Products */}
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs hover:border-[#18281B]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#6E736B]">Active Products</span>
            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-sans text-2xl sm:text-3xl font-semibold text-[#18281B] tracking-tight">
              {counts.activeProducts}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-[#6E736B]">
            <span>Live in store</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section matching PDF Page 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Orders & Top Categories / Recent Customers (~68% width) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Orders Card */}
          <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans font-semibold text-base sm:text-lg text-[#18281B]">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="font-sans text-xs text-[#5A6258] hover:text-[#18281B] font-medium flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Orders Table or Empty State */}
            {displayOrders.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF7EB] border border-[#DED6BE] flex items-center justify-center text-[#7A8278] mb-3">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="font-sans font-medium text-sm text-[#18281B]">No orders yet</h4>
                <p className="font-sans text-xs text-[#6E736B] max-w-xs mx-auto mt-1">
                  Orders placed by clients in the store will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#EBE4D2] text-[11px] font-sans font-medium text-[#7A8278] uppercase tracking-wider">
                      <th className="py-2.5 px-5 sm:px-6">Order #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE0] text-xs font-sans">
                    {displayOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF7EB]/50 transition-colors">
                        <td className="py-3 px-5 sm:px-6 font-medium text-[#18281B]">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-4 text-[#3D453E] font-medium">
                          {ord.customer_name}
                        </td>
                        <td className="py-3 px-4 text-[#7A8278]">{ord.date}</td>
                        <td className="py-3 px-4 text-[#18281B] font-medium">{ord.total}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${ord.statusClass}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 sm:px-6 text-right">
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#EDE7D4] text-[#5A6258] hover:text-[#18281B] transition-colors"
                            title="View order"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-grid of 2 Cards: Top Categories & Recent Customers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Categories Card */}
            <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-semibold text-sm sm:text-base text-[#18281B]">
                  Categories
                </h3>
                <Link
                  to="/admin/catalog/categories"
                  className="font-sans text-xs text-[#5A6258] hover:text-[#18281B] font-medium flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {realCategories.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-sans text-xs text-[#6E736B]">No categories created yet.</p>
                  <Link
                    to="/admin/catalog/categories"
                    className="inline-flex items-center gap-1 text-xs text-[#2D6636] font-medium hover:underline mt-2"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {realCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7EB]/50 border border-[#EBE4D2]">
                      <span className="font-sans text-xs font-medium text-[#18281B]">{cat.name}</span>
                      <span className="font-mono text-[10.5px] text-[#7A8278]">/{cat.slug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Customers Card */}
            <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-semibold text-sm sm:text-base text-[#18281B]">
                  Recent Customers
                </h3>
                <Link
                  to="/admin/customers"
                  className="font-sans text-xs text-[#5A6258] hover:text-[#18281B] font-medium flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {displayCustomers.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 mx-auto rounded-full bg-[#FAF7EB] border border-[#DED6BE] flex items-center justify-center text-[#7A8278] mb-2">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="font-sans text-xs text-[#6E736B]">No customers registered yet.</p>
                  <p className="font-sans text-[11px] text-[#8A9288] mt-0.5">
                    Profiles will appear as orders are placed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayCustomers.map((c) => (
                    <div key={c.email} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EAF4EE] text-[#2D6636] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#D2E4D8]">
                        {c.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs font-medium text-[#18281B] truncate">
                          {c.name}
                        </p>
                        <p className="font-sans text-[11px] text-[#7A8278] truncate">{c.email}</p>
                      </div>
                      <span className="text-[10px] text-[#8A9288] shrink-0">{c.joined}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: ELIF Fashion Admin Panel, Quick Actions, Need Help? (~32% width) */}
        <div className="lg:col-span-4 space-y-6">
          {/* ELIF Fashion Admin Panel Hero Card matching PDF */}
          <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs relative overflow-hidden">
            <div className="relative z-10">
              <span className="font-serif text-xl tracking-[0.2em] text-[#18281B] block font-light">
                ELIF
              </span>
              <h3 className="font-sans font-semibold text-sm text-[#18281B] mt-0.5">
                Fashion Admin Panel
              </h3>
              <p className="font-sans text-xs text-[#6E736B] mt-2 leading-relaxed max-w-[200px]">
                Manage your store, products, orders and more — all in one place.
              </p>
            </div>

            {/* Thumbnail Fashion editorial image matching PDF */}
            <div className="mt-4 w-full h-36 rounded-lg overflow-hidden border border-[#DED6BE]/60">
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80"
                alt="ELIF Luxury Atelier"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Quick Actions Card matching PDF */}
          <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs">
            <h3 className="font-sans font-semibold text-sm sm:text-base text-[#18281B] mb-3">
              Quick Actions
            </h3>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/admin/catalog/products/new')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-[#18281B] hover:bg-[#FAF7EB] transition-colors border border-transparent hover:border-[#DED6BE] cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#EAF4EE] text-[#2D6636] flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Add New Product</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A8278]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/marketing/coupons')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-[#18281B] hover:bg-[#FAF7EB] transition-colors border border-transparent hover:border-[#DED6BE] cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FEF3E2] text-[#D97706] flex items-center justify-center">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Create Coupon</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A8278]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/marketing/promotions')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-[#18281B] hover:bg-[#FAF7EB] transition-colors border border-transparent hover:border-[#DED6BE] cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Add Promotion</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A8278]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/orders')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-[#18281B] hover:bg-[#FAF7EB] transition-colors border border-transparent hover:border-[#DED6BE] cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">View Orders</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A8278]" />
              </button>
            </div>
          </div>

          {/* Need Help? Card matching PDF */}
          <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-5 shadow-2xs text-center">
            <div className="w-10 h-10 rounded-full bg-[#FAF7EB] border border-[#DED6BE] text-[#2D6636] flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-4 h-4" />
            </div>
            <h4 className="font-sans font-semibold text-sm text-[#18281B]">Need Help?</h4>
            <p className="font-sans text-xs text-[#6E736B] mt-1 leading-relaxed">
              Contact support if you need any assistance.
            </p>
            <button
              type="button"
              onClick={() => alert('Support team: support@elif.fashion\nHours: 10:00 AM - 8:00 PM BST')}
              className="mt-4 w-full py-2.5 px-4 bg-[#18281B] hover:bg-[#2D4B36] text-[#FFFFFF] rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
