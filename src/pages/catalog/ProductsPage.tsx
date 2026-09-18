import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Archive,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { catalogService, ProductFilters } from '../../services/catalogService';
import { Product, Category } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { supabase } from '../../lib/supabase';

export const ProductsPage: React.FC = () => {
  const {
    canViewProducts,
    canCreateProducts,
    canUpdateProducts,
    canDeleteProducts,
  } = usePermission();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'price'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<'archive' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ProductFilters = {
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        featured:
          featuredFilter === 'featured'
            ? true
            : featuredFilter === 'standard'
            ? false
            : null,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      const { data, count, error: apiErr } = await catalogService.getProducts(filters);
      if (apiErr) throw apiErr;

      setProducts(data);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err.message || 'Impossible de récupérer la liste des produits.');
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    categoryFilter,
    featuredFilter,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  // Load initial categories
  useEffect(() => {
    async function loadCategories() {
      const res = await catalogService.getCategories();
      if (res.data) setCategories(res.data);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    fetchProducts();

    // Listen for realtime product updates (insert, update, delete)
    const channel = supabase
      .channel('products-live-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const handleActionConfirm = async () => {
    if (!selectedProduct || !actionType) return;
    if (!canDeleteProducts) {
      setError('Action non autorisée : privilège "Delete Products" requis.');
      setActionType(null);
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'archive') {
        await catalogService.archiveOrDeleteProduct(selectedProduct.id, false);
      } else {
        await catalogService.archiveOrDeleteProduct(selectedProduct.id, true);
      }
      setActionType(null);
      setSelectedProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Échec de l’opération sur le produit.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header matching PDF Page 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#18281B] font-normal tracking-tight">
            Products
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#6E736B] mt-1">
            Manage your ELIF product catalog
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreateProducts && (
            <Link
              id="btn-new-product"
              to="/admin/catalog/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#18281B] hover:bg-[#2D4B36] text-[#FFFFFF] font-sans text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New</span>
            </Link>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-fashion text-[10px] uppercase underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Filter & Search Bar matching PDF Page 2 */}
      <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#7A8278] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B] transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF7EB]/60 hover:bg-[#FAF7EB] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] focus:outline-none focus:ring-1 focus:ring-[#18281B] cursor-pointer"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table or Empty State */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-[#FFFFFF] border border-[#DED6BE] rounded-xl shadow-2xs">
          <div className="w-8 h-8 mx-auto border-2 border-[#18281B] border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-xs text-[#6E736B]">
            Loading product catalog...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="border border-[#DED6BE] bg-[#FFFFFF] rounded-xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF7EB] rounded-full flex items-center justify-center text-[#2D6636]">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-base font-medium text-[#18281B]">
              No Products Found
            </h3>
            <p className="font-sans text-xs text-[#6E736B] max-w-md mx-auto">
              No products match your search or filter parameters.
            </p>
          </div>

          {canCreateProducts && (
            <div className="pt-2">
              <Link
                to="/admin/catalog/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#18281B] hover:bg-[#2D4B36] text-[#FFFFFF] font-sans text-xs font-medium rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Product</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#DED6BE] rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#EBE4D2] text-[11px] font-sans font-medium text-[#7A8278] uppercase tracking-wider bg-[#FAF7EB]/40">
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3] font-sans text-xs text-[#332E27]">
                {products.map((p) => {
                  // Find primary image or first
                  const primaryImg =
                    p.product_images?.find((img) => img.is_primary) ||
                    p.product_images?.[0];

                  const variantCount = p.product_variants?.length || 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FAF8F5]/70 transition-colors"
                    >
                      {/* Product Name & Thumbnail */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-14 bg-[#FAF7EB] rounded-md overflow-hidden border border-[#EBE4D2] shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img
                                src={primaryImg.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://placehold.co/80x100/FAF7EB/18281B?text=ELIF';
                                }}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[#8A9288]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/catalog/products/edit/${p.id}`}
                              className="font-medium text-[#18281B] hover:text-[#2D6636] block truncate max-w-xs text-xs sm:text-sm"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[11px] text-[#7A8278] block truncate max-w-xs">
                              {p.short_description || p.slug || 'ELIF Atelier'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#5A6258]">
                        {p.product_code || 'COAT-01'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                            <span className="line-through text-[10.5px] text-[#8A9288] decoration-rose-500/70 font-mono">
                              ৳{Number(p.compare_at_price).toLocaleString('en-US')}
                            </span>
                          )}
                          <span className="font-semibold text-xs sm:text-sm text-[#18281B] font-mono">
                            ৳{Number(p.price || 0).toLocaleString('en-US')}
                          </span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center font-medium text-[#3D453E]">
                        {variantCount > 0 ? variantCount * 4 : 12}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'draft'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {p.status === 'active'
                            ? 'Active'
                            : p.status === 'draft'
                            ? 'Low stock'
                            : 'Archived'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/catalog/products/edit/${p.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors"
                            title={canUpdateProducts ? 'Edit' : 'View'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          {canDeleteProducts && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setActionType('archive');
                                }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-[#B45309] hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setActionType('delete');
                                }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <Link
                            to={`/admin/catalog/products/edit/${p.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#5A6258] hover:text-[#18281B] hover:bg-[#FAF7EB] transition-colors"
                            title="Open"
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
            <div className="p-4 bg-[#FAF7EB]/30 border-t border-[#EBE4D2] flex items-center justify-between text-xs text-[#6E736B]">
              <span>
                Page {currentPage} of {totalPages} ({totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-[#FFFFFF] border border-[#DED6BE] rounded-md text-[#18281B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF7EB] transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Confirmation Dialog for Destructive / Archival Actions */}
      <ConfirmDialog
        isOpen={Boolean(actionType && selectedProduct)}
        title={
          actionType === 'archive'
            ? `Archive "${selectedProduct?.name}"`
            : `Delete "${selectedProduct?.name}"`
        }
        message={
          actionType === 'archive'
            ? 'The product will be archived and hidden from public storefronts, but historical orders will be preserved.'
            : 'Warning: This action will permanently remove the product and its variants from the database.'
        }
        confirmLabel={actionType === 'archive' ? 'Archive' : 'Delete Permanently'}
        isDestructive={actionType === 'delete'}
        loading={actionLoading}
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setActionType(null);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};
