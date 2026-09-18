import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { Category, Collection, ProductMaterial, Product } from '../../types';
import { ProductImageManager } from '../../components/catalog/ProductImageManager';
import { ProductVariantManager } from '../../components/catalog/ProductVariantManager';
import { usePermission } from '../../hooks/usePermission';

export const ProductEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { canCreateProducts, canUpdateProducts } = usePermission();
  const hasAccess = isEditing ? canUpdateProducts : canCreateProducts;

  // 1. PRODUCT INFORMATION
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active');

  // 2. PRICING (BDT)
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [currency, setCurrency] = useState('BDT');

  // 3. CATEGORY ASSIGNMENT
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Quick Add Category Modal state
  const [isQuickCatOpen, setIsQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [savingQuickCat, setSavingQuickCat] = useState(false);
  const [quickCatError, setQuickCatError] = useState<string | null>(null);

  // 4. SIZES & VARIANTS
  const [variants, setVariants] = useState<any[]>([]);

  // 5. PRODUCT PHOTOS
  const [images, setImages] = useState<any[]>([]);

  // Optional / Advanced Details
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [badge, setBadge] = useState('');
  const [brand, setBrand] = useState('ELIF');
  const [shortDescription, setShortDescription] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [shippingInformation, setShippingInformation] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Collections & Materials
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<ProductMaterial[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const DRAFT_KEY = 'elif_admin_product_draft';

  // Restore draft if creating a new product
  useEffect(() => {
    if (isEditing) return;
    try {
      const savedDraft = sessionStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.name) setName(d.name);
        if (d.productCode) setProductCode(d.productCode);
        if (d.slug) setSlug(d.slug);
        if (d.price) setPrice(d.price);
        if (d.compareAtPrice) setCompareAtPrice(d.compareAtPrice);
        if (d.description) setDescription(d.description);
        if (d.status) setStatus(d.status);
        if (d.selectedCategoryIds) setSelectedCategoryIds(d.selectedCategoryIds);
        if (d.variants && d.variants.length > 0) setVariants(d.variants);
        if (d.images && d.images.length > 0) setImages(d.images);
        if (d.badge) setBadge(d.badge);
        if (d.shortDescription) setShortDescription(d.shortDescription);
        if (d.careInstructions) setCareInstructions(d.careInstructions);
        if (d.shippingInformation) setShippingInformation(d.shippingInformation);
        if (d.seoTitle) setSeoTitle(d.seoTitle);
        if (d.seoDescription) setSeoDescription(d.seoDescription);
        setDraftRestored(true);
      }
    } catch (e) {
      console.warn('Could not restore draft:', e);
    }
  }, [isEditing]);

  // Debounced auto-save draft to sessionStorage
  useEffect(() => {
    if (isEditing) return;
    if (!name && !productCode && !price && !description && images.length === 0 && variants.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      try {
        const draftData = {
          name,
          productCode,
          slug,
          price,
          compareAtPrice,
          description,
          status,
          selectedCategoryIds,
          variants,
          images,
          badge,
          shortDescription,
          careInstructions,
          shippingInformation,
          seoTitle,
          seoDescription,
          savedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch (e) {
        // Ignore quota limits
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isEditing,
    name,
    productCode,
    slug,
    price,
    compareAtPrice,
    description,
    status,
    selectedCategoryIds,
    variants,
    images,
    badge,
    shortDescription,
    careInstructions,
    shippingInformation,
    seoTitle,
    seoDescription,
  ]);

  const clearDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setName('');
    setProductCode('');
    setSlug('');
    setPrice('');
    setCompareAtPrice('');
    setDescription('');
    setSelectedCategoryIds([]);
    setVariants([]);
    setImages([]);
    setBadge('');
    setShortDescription('');
    setCareInstructions('');
    setShippingInformation('');
    setSeoTitle('');
    setSeoDescription('');
    setDraftRestored(false);
  };

  // Auto-generate slug from name if new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  // Load catalogs (categories, collections, materials)
  const refreshCategories = async () => {
    try {
      const catsRes = await catalogService.getCategories();
      if (catsRes.data) setAvailableCategories(catsRes.data);
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  };

  useEffect(() => {
    async function loadCatalogRelations() {
      try {
        const [catsRes, colsRes, matsRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getCollections(),
          catalogService.getMaterials(),
        ]);
        if (catsRes.data) setAvailableCategories(catsRes.data);
        if (colsRes.data) setAvailableCollections(colsRes.data);
        if (matsRes.data) setAvailableMaterials(matsRes.data);
      } catch (err) {
        console.warn('Could not load catalog relations:', err);
      }
    }
    loadCatalogRelations();
  }, []);

  // If editing, load existing product data
  useEffect(() => {
    if (!id) return;
    async function loadProduct() {
      setLoading(true);
      const { data: prod, error } = await catalogService.getProductById(id);
      if (error || !prod) {
        setFeedback({
          type: 'error',
          message: error?.message || 'Failed to load product details.',
        });
        setLoading(false);
        return;
      }

      setName(prod.name || '');
      setSlug(prod.slug || '');
      setProductCode(prod.product_code || '');
      setPrice(prod.price !== undefined && prod.price !== null ? String(prod.price) : '');
      setCompareAtPrice(prod.compare_at_price ? String(prod.compare_at_price) : '');
      setCurrency(prod.currency || 'BDT');
      setStatus((prod.status as any) || 'active');
      setFeatured(Boolean(prod.featured));
      setBadge(prod.badge || '');
      setBrand(prod.brand || 'ELIF');
      setShortDescription(prod.short_description || '');
      setDescription(prod.description || '');
      setCareInstructions(prod.care_instructions || '');
      setShippingInformation(prod.shipping_information || '');
      setSeoTitle(prod.seo_title || '');
      setSeoDescription(prod.seo_description || '');

      // Relations
      if (prod.product_categories) {
        setSelectedCategoryIds(prod.product_categories.map((c) => c.category_id));
      }
      if (prod.product_collections) {
        setSelectedCollectionIds(prod.product_collections.map((c) => c.collection_id));
      }
      if (prod.product_material_map) {
        setSelectedMaterialIds(prod.product_material_map.map((m) => m.material_id));
      }
      if (prod.product_images) {
        setImages(prod.product_images);
      }
      if (prod.product_variants) {
        setVariants(prod.product_variants);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  // Handle Quick Add Category
  const handleCreateQuickCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickCatName.trim();
    if (!trimmed) {
      setQuickCatError('Please enter a category name.');
      return;
    }

    setSavingQuickCat(true);
    setQuickCatError(null);

    try {
      const { data: newCat, error } = await catalogService.createCategory({
        name: trimmed,
        is_active: true,
      });

      if (error) throw error;

      if (newCat) {
        // Refresh category list and select the new category
        await refreshCategories();
        setSelectedCategoryIds((prev) => [...prev, newCat.id]);
        setIsQuickCatOpen(false);
        setQuickCatName('');
      }
    } catch (err: any) {
      setQuickCatError(err.message || 'Failed to create category.');
    } finally {
      setSavingQuickCat(false);
    }
  };

  // Validate and submit product
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasAccess) {
      setFeedback({
        type: 'error',
        message: 'You do not have permission to save products.',
      });
      return;
    }

    // 1. Validate Product Name
    if (!name.trim()) {
      setFeedback({
        type: 'error',
        message: 'Product Name is required. Example: Cocoon Coat, Silk Draped Dress.',
      });
      return;
    }

    // 2. Validate Product Code
    const trimmedCode = productCode.trim();
    if (!trimmedCode) {
      setFeedback({
        type: 'error',
        message: 'Product Code is required. Example: ELF-CT-001, ELF-DR-042.',
      });
      return;
    }

    // Check unique product code
    const isCodeUnique = await catalogService.isProductCodeUnique(trimmedCode, id);
    if (!isCodeUnique) {
      setCodeError(`Product Code "${trimmedCode}" is already in use by another product.`);
      setFeedback({
        type: 'error',
        message: `Product Code "${trimmedCode}" is already in use. Please enter a unique product code.`,
      });
      return;
    }
    setCodeError(null);

    // 3. Validate Price (BDT)
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFeedback({
        type: 'error',
        message: 'Product Price is required and must be a positive number in BDT (৳).',
      });
      return;
    }

    // 4. Validate Description
    if (!description.trim()) {
      setFeedback({
        type: 'error',
        message: 'Product Description is required. Please provide a description of the garment.',
      });
      return;
    }

    // 5. Slug fallback
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    setSaving(true);
    setFeedback(null);

    const productPayload: Partial<Product> = {
      name: name.trim(),
      slug: finalSlug,
      product_code: trimmedCode,
      price: numPrice,
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      currency: 'BDT',
      status,
      featured,
      badge: badge.trim() || null,
      brand: brand.trim() || 'ELIF',
      short_description: shortDescription.trim() || null,
      description: description.trim(),
      care_instructions: careInstructions.trim() || null,
      shipping_information: shippingInformation.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };

    try {
      if (isEditing && id) {
        const { error } = await catalogService.updateProduct(id, productPayload, {
          categoryIds: selectedCategoryIds,
          collectionIds: selectedCollectionIds,
          materialIds: selectedMaterialIds,
          images,
          variants,
        });

        if (error) throw error;

        setFeedback({
          type: 'success',
          message: 'Product updated successfully.',
        });
      } else {
        const { data: created, error } = await catalogService.createProduct(productPayload, {
          categoryIds: selectedCategoryIds,
          collectionIds: selectedCollectionIds,
          materialIds: selectedMaterialIds,
          images,
          variants,
        });

        if (error) throw error;

        // Clear draft on successful creation
        sessionStorage.removeItem(DRAFT_KEY);
        setDraftRestored(false);

        setFeedback({
          type: 'success',
          message: 'Product created successfully.',
        });

        if (created?.id) {
          setTimeout(() => {
            navigate('/admin/catalog/products');
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save product in database.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((i) => i !== catId) : [...prev, catId]
    );
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-[#DED6BE] rounded-xl">
        <div className="w-8 h-8 mx-auto border-2 border-[#18281B] border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-xs text-[#6E736B]">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/catalog/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#6E736B] hover:text-[#18281B] transition-colors mb-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#18281B] tracking-tight">
            {isEditing ? `Edit Product: ${name || 'Untitled'}` : 'New Product'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/catalog/products"
            className="px-4 py-2.5 bg-white border border-[#DED6BE] text-[#18281B] font-sans text-xs font-medium rounded-lg hover:bg-[#FAF7EB] transition-colors"
          >
            Cancel
          </Link>
          <button
            id="btn-save-product-top"
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving || !hasAccess}
            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-[#18281B] text-white font-sans text-xs font-medium rounded-lg hover:bg-[#2D6636] transition-all cursor-pointer shadow-xs ${
              saving || !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      {/* Auto-save Draft Restored Notification */}
      {draftRestored && (
        <div className="p-3.5 bg-[#FAF7EB] border border-[#DED6BE] rounded-xl flex items-center justify-between text-xs text-[#18281B]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span className="font-sans">Unsaved draft was automatically restored. Your inputs are safe.</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-[11px] font-medium text-[#8A9288] hover:text-rose-600 underline cursor-pointer"
          >
            Clear Draft
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-[#EAF4EE] border-[#D2E4D8] text-[#2D6636]'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#2D6636] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-sans leading-relaxed">{feedback.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================================================== */}
        {/* 1. PRODUCT INFORMATION */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D2]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2D6636]" />
              <h2 className="font-sans text-sm font-semibold text-[#18281B]">
                Product Information
              </h2>
            </div>
            <span className="text-[11px] text-[#8A9288]">Essential garment identifiers</span>
          </div>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block font-sans text-xs font-medium text-[#18281B] mb-1.5">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Cocoon Coat, Silk Draped Dress, Premium Linen Shirt"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-sm text-[#18281B] font-medium placeholder-[#8A9288] focus:outline-none focus:border-[#18281B]"
              />
            </div>

            {/* Product Code & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs font-medium text-[#18281B] mb-1.5">
                  Product Code / SKU <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-product-code"
                  type="text"
                  required
                  value={productCode}
                  onChange={(e) => {
                    setProductCode(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  placeholder="e.g. ELF-CT-001, ELF-DR-042"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs font-mono text-[#18281B] placeholder-[#8A9288] focus:outline-none ${
                    codeError ? 'border-rose-500' : 'border-[#DED6BE] focus:border-[#18281B]'
                  }`}
                />
                {codeError && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{codeError}</p>
                )}
                <p className="text-[11px] text-[#8A9288] mt-1">
                  Must be unique across all products.
                </p>
              </div>

              <div>
                <label className="block font-sans text-xs font-medium text-[#18281B] mb-1.5">
                  Product Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] focus:outline-none focus:border-[#18281B]"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="draft">Draft (Admin Only)</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-[11px] text-[#8A9288] mt-1">
                  Active products appear on customer collections.
                </p>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <label className="block font-sans text-xs font-medium text-[#18281B] mb-1.5">
                Product Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="input-product-description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A modern relaxed fit jacket crafted from Japanese wool blend. Features dropped shoulders, horn buttons, and an unstructured silhouette."
                className="w-full px-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B] leading-relaxed placeholder-[#8A9288] focus:outline-none focus:border-[#18281B]"
              />
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. PRICING (BDT) */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D2]">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold text-[#2D6636]">৳</span>
              <h2 className="font-sans text-sm font-semibold text-[#18281B]">
                Product Pricing (BDT)
              </h2>
            </div>
            <span className="text-[11px] text-[#8A9288]">Bangladeshi Taka (৳)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-[#18281B] mb-1.5">
                Current Selling Price (BDT / ৳) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans font-semibold text-sm text-[#6E736B]">
                  ৳
                </span>
                <input
                  id="input-product-price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1357"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-sm font-mono text-[#18281B] font-semibold placeholder-[#8A9288] focus:outline-none focus:border-[#18281B]"
                />
              </div>
              <p className="text-[11px] text-[#2D6636] font-medium mt-1">
                অফার / বিক্রয় মূল্য — কাস্টমার ওয়েবসাইটে বড় অক্ষরে দেখানো হবে।
              </p>
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-[#18281B] mb-1.5">
                Compare-at Price / Original Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans font-semibold text-sm text-[#6E736B]">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="7864"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-sm font-mono text-[#7A8278] placeholder-[#8A9288] focus:outline-none focus:border-[#18281B]"
                />
              </div>
              <p className="text-[11px] text-[#8A9288] mt-1">
                আগের মূল দাম — কাস্টমার ওয়েবসাইটে উপরে ছোট করে কেটে (strikethrough) দেখানো হবে।
              </p>
            </div>
          </div>

          {/* Customer Storefront Visual Preview */}
          {(price || compareAtPrice) && (() => {
            const currentP = parseFloat(price) || 0;
            const compareP = parseFloat(compareAtPrice) || 0;
            const hasDiscount = compareP > currentP && currentP > 0;
            const discountPct = hasDiscount ? Math.round(((compareP - currentP) / compareP) * 100) : 0;
            const savings = hasDiscount ? compareP - currentP : 0;

            return (
              <div className="mt-4 pt-4 border-t border-[#EBE4D2] bg-[#FAF7EB]/70 p-4 rounded-xl border border-[#DED6BE]/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#2D6636]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4E564E]">
                      Customer Website Live Preview (কাস্টমার যেভাবে দেখবে)
                    </span>
                  </div>
                  {hasDiscount && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3 flex-wrap">
                  {/* Compare-at / Original Price (Small & Slashed) */}
                  {compareP > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-[#8A9288] tracking-wider">
                        Original Price
                      </span>
                      <span className="font-sans text-sm sm:text-base line-through text-[#8A9288] font-medium decoration-rose-500/80 decoration-2">
                        ৳{compareP.toLocaleString('en-US')}
                      </span>
                    </div>
                  )}

                  {/* Selling Price (Large & Bold) */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold text-[#2D6636] tracking-wider">
                      Special Offer Price
                    </span>
                    <span className="font-sans text-2xl sm:text-3xl font-extrabold text-[#18281B] tracking-tight">
                      ৳{currentP > 0 ? currentP.toLocaleString('en-US') : '0'}
                    </span>
                  </div>

                  {hasDiscount && (
                    <div className="self-end pb-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Savings: ৳{savings.toLocaleString('en-US')}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#6E756C] mt-2 font-medium">
                  {hasDiscount
                    ? `✓ পারফেক্ট! কাস্টমার ওয়েবসাইটে ৳${compareP.toLocaleString('en-US')} কেটে দিয়ে ৳${currentP.toLocaleString('en-US')} হাইলাইট থাকবে, ফলে ক্রেতারা ডিসকাউন্ট দেখবে।`
                    : 'টিপস: "Compare-at Price"-এ মূল দাম (যেমন ৳৭,৮৬৪) এবং "Current Selling Price"-এ অফার দাম (যেমন ৳১,৩৫৭) দিলে ডিসকাউন্ট আকর্ষণীয়ভাবে প্রদর্শিত হবে।'}
                </p>
              </div>
            );
          })()}
        </div>

        {/* ================================================== */}
        {/* 3. PRODUCT CATEGORY ASSIGNMENT */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D2]">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2D6636]" />
              <h2 className="font-sans text-sm font-semibold text-[#18281B]">
                Product Category Assignment
              </h2>
            </div>
            <button
              id="btn-quick-add-category"
              type="button"
              onClick={() => {
                setQuickCatName('');
                setQuickCatError(null);
                setIsQuickCatOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-sans font-medium text-[#2D6636] hover:text-[#18281B] bg-[#EAF4EE] px-2.5 py-1 rounded-md border border-[#D2E4D8] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Category</span>
            </button>
          </div>

          <div>
            <span className="font-sans text-xs font-medium text-[#6E736B] block mb-2">
              Select one or more categories:
            </span>

            {availableCategories.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#FAF7EB] border border-[#DED6BE] text-center">
                <p className="text-xs text-[#6E736B]">No categories exist yet.</p>
                <button
                  type="button"
                  onClick={() => setIsQuickCatOpen(true)}
                  className="mt-2 text-xs font-medium text-[#2D6636] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create your first category</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-sans cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FAF7EB] border-[#18281B] text-[#18281B] font-medium shadow-2xs'
                          : 'bg-white border-[#DED6BE] text-[#3D453E] hover:border-[#18281B]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(cat.id)}
                        className="w-4 h-4 accent-[#18281B] rounded cursor-pointer"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* 4. SIZES & VARIANTS */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D2]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2D6636]" />
              <h2 className="font-sans text-sm font-semibold text-[#18281B]">
                Available Sizes
              </h2>
            </div>
            <span className="text-[11px] text-[#8A9288]">Individual size entries</span>
          </div>

          <ProductVariantManager
            variants={variants}
            onChange={setVariants}
            basePrice={parseFloat(price) || 0}
            productCode={productCode}
            disabled={!hasAccess}
          />
        </div>

        {/* ================================================== */}
        {/* 5. PRODUCT PHOTOS */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D2]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2D6636]" />
              <h2 className="font-sans text-sm font-semibold text-[#18281B]">
                Product Photos
              </h2>
            </div>
            <span className="text-[11px] text-[#8A9288]">
              Direct Upload & Google Drive links
            </span>
          </div>

          <ProductImageManager
            images={images}
            onChange={setImages}
            disabled={!hasAccess}
          />
        </div>

        {/* ================================================== */}
        {/* OPTIONAL / ADVANCED DETAILS TOGGLE */}
        {/* ================================================== */}
        <div className="bg-white border border-[#DED6BE] rounded-xl p-5 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between font-sans text-xs font-medium text-[#18281B] hover:text-[#2D6636] transition-colors cursor-pointer"
          >
            <span>Additional Details (Collections, SEO, Care)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-[#EBE4D2] space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#18281B] mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-slug-url"
                    className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg font-mono text-xs text-[#18281B]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#18281B] mb-1">Editorial Badge</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. New Arrival, Exclusive"
                    className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#18281B] mb-1">Care Instructions</label>
                <textarea
                  rows={2}
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="Dry clean only..."
                  className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#18281B] mb-1">Shipping Information</label>
                <textarea
                  rows={2}
                  value={shippingInformation}
                  onChange={(e) => setShippingInformation(e.target.value)}
                  placeholder="Shipped in signature ELIF box..."
                  className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#18281B] mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Product Title | ELIF"
                    className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#18281B] mb-1">SEO Description</label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Short summary for search engines"
                    className="w-full px-3 py-2 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* BOTTOM ACTION BAR */}
        {/* ================================================== */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DED6BE]">
          <Link
            to="/admin/catalog/products"
            className="px-5 py-2.5 bg-white border border-[#DED6BE] text-[#18281B] font-sans text-xs font-medium rounded-lg hover:bg-[#FAF7EB] transition-colors"
          >
            Cancel
          </Link>

          <button
            id="btn-save-product-bottom"
            type="submit"
            disabled={saving || !hasAccess}
            className={`inline-flex items-center gap-2 px-8 py-3 bg-[#18281B] text-white font-sans text-xs font-medium rounded-lg hover:bg-[#2D6636] transition-all cursor-pointer shadow-sm ${
              saving || !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving Product...' : 'Save Product'}</span>
          </button>
        </div>
      </form>

      {/* QUICK ADD CATEGORY MODAL (Category Name Only) */}
      {isQuickCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18281B]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#DED6BE] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBE4D2]">
              <h3 className="font-sans text-sm font-semibold text-[#18281B]">
                Add Category
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCatOpen(false)}
                className="text-[#7A8278] hover:text-[#18281B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCategory} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-medium text-[#18281B] mb-1.5">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickCatName}
                  onChange={(e) => setQuickCatName(e.target.value)}
                  placeholder="e.g. Outerwear, Dresses, Tailoring..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-xs text-[#18281B] focus:outline-none focus:border-[#2D6636]"
                />
              </div>

              {quickCatError && (
                <p className="text-xs text-rose-600">{quickCatError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EBE4D2]">
                <button
                  type="button"
                  onClick={() => setIsQuickCatOpen(false)}
                  className="px-3.5 py-2 text-[#6E736B] hover:text-[#18281B] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-quick-category"
                  type="submit"
                  disabled={savingQuickCat}
                  className="px-4 py-2 bg-[#18281B] hover:bg-[#2D6636] text-white font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  {savingQuickCat ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
