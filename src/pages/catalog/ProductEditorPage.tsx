import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  Scissors,
  FileText,
  ShieldAlert,
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

  const { canCreateProducts, canUpdateProducts, isSuperAdmin } = usePermission();
  const hasAccess = isEditing ? canUpdateProducts : canCreateProducts;

  // Form states matching existing products table exactly
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [featured, setFeatured] = useState(false);
  const [badge, setBadge] = useState('');
  const [brand, setBrand] = useState('ELIF');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [shippingInformation, setShippingInformation] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Relationships
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<ProductMaterial[]>([]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // Images & Variants
  const [images, setImages] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-generate slug from name if new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !slug) {
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

  // If editing, load product data
  useEffect(() => {
    if (!id) return;
    async function loadProduct() {
      setLoading(true);
      const { data: prod, error } = await catalogService.getProductById(id);
      if (error || !prod) {
        setFeedback({
          type: 'error',
          message: error?.message || 'Impossible de charger les données du produit.',
        });
        setLoading(false);
        return;
      }

      setName(prod.name || '');
      setSlug(prod.slug || '');
      setProductCode(prod.product_code || '');
      setPrice(prod.price ? String(prod.price) : '0');
      setCompareAtPrice(prod.compare_at_price ? String(prod.compare_at_price) : '');
      setCurrency(prod.currency || 'EUR');
      setStatus((prod.status as any) || 'draft');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) {
      setFeedback({
        type: 'error',
        message: 'Vous ne possédez pas les autorisations requises pour enregistrer ce produit.',
      });
      return;
    }

    if (!name.trim() || !slug.trim()) {
      setFeedback({
        type: 'error',
        message: 'Le nom de la création et son identifiant unique (slug) sont obligatoires.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const productPayload: Partial<Product> = {
      name: name.trim(),
      slug: slug.trim(),
      product_code: productCode.trim() || null,
      price: parseFloat(price) || 0,
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      currency,
      status,
      featured,
      badge: badge.trim() || null,
      brand: brand.trim() || 'ELIF',
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
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
        });

        if (error) throw error;

        setFeedback({
          type: 'success',
          message: 'Création mise à jour avec succès dans le catalogue officiel.',
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

        setFeedback({
          type: 'success',
          message: 'Nouvelle création enregistrée avec succès.',
        });

        if (created?.id) {
          setTimeout(() => {
            navigate(`/admin/catalog/products/edit/${created.id}`);
          }, 800);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de l’enregistrement dans la base Supabase.',
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

  const toggleCollection = (colId: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((i) => i !== colId) : [...prev, colId]
    );
  };

  const toggleMaterial = (matId: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(matId) ? prev.filter((i) => i !== matId) : [...prev, matId]
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 bg-white border border-[#E5DFD5]">
        <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
        <p className="font-fashion text-[10px] uppercase tracking-widest text-[#7A7162]">
          Chargement de la fiche atelier...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/catalog/products"
            className="inline-flex items-center gap-1.5 font-fashion text-[9px] uppercase tracking-[0.2em] text-[#7D7566] hover:text-[#0A1C14] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au Catalogue</span>
          </Link>
          <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
            {isEditing ? `Modifier : ${name || 'Création'}` : 'Nouvelle Création Haute Couture'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/catalog/products"
            className="px-4 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#524B3F] font-fashion text-[10px] uppercase tracking-wider hover:bg-[#F2ECE3] transition-colors"
          >
            Annuler
          </Link>
          <button
            id="btn-save-product"
            type="button"
            onClick={handleSubmit}
            disabled={saving || !hasAccess}
            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#143325] transition-all cursor-pointer shadow-xs ${
              saving || !hasAccess ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer la Création'}</span>
          </button>
        </div>
      </div>

      {/* Permission Warning if viewer only */}
      {!hasAccess && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Mode consultation uniquement : votre compte ne dispose pas du droit d'écriture pour créer ou modifier les articles.
          </span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-sans leading-relaxed">{feedback.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Essential Product Info */}
          <div className="bg-white border border-[#E5DFD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#8C7355]" />
                <h2 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                  Identité de la Création
                </h2>
              </div>
              <span className="font-fashion text-[9px] uppercase tracking-wider text-[#7A7162]">
                Table public.products
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Nom du Produit / Intitulé Couture <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ex. Robe Vespera en Crêpe de Soie"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-sm text-[#0A1C14] font-medium focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                    Slug URL Unique <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="robe-vespera-crepe-soie"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>

                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                    Code Produit Atelier (product_code)
                  </label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="ELF-2026-HC01"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                    Prix Vente (€) <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1850.00"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-sm font-mono text-[#0A1C14] font-medium focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>

                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                    Prix Comparatif / Barré (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Optionnel"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-sm font-mono text-[#7A7162] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>

                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                    Devise
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Courte Description Éditoriale
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Ligne fluide sculptée dans une étoffe d'exception..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-serif italic text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Description Détaillée
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Récit de l'inspiration couture, drapé à la main, finitions point sellier..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] leading-relaxed focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
            </div>
          </div>

          {/* 2. Visuals & Lookbook Images */}
          <div className="bg-white border border-[#E5DFD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#8C7355]" />
                <h2 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                  Photographies & Visuels d'Atelier
                </h2>
              </div>
              <span className="font-fashion text-[9px] uppercase tracking-wider text-[#7A7162]">
                Table public.product_images
              </span>
            </div>

            <ProductImageManager
              images={images}
              onChange={setImages}
              disabled={!hasAccess}
            />
          </div>

          {/* 3. Variants & Sizes */}
          <div className="bg-white border border-[#E5DFD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8C7355]" />
                <h2 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                  Déclinaisons, Tailles & Stocks
                </h2>
              </div>
              <span className="font-fashion text-[9px] uppercase tracking-wider text-[#7A7162]">
                Table public.product_variants & inventory
              </span>
            </div>

            <ProductVariantManager
              variants={variants}
              onChange={setVariants}
              basePrice={parseFloat(price) || 0}
              disabled={!hasAccess}
            />
          </div>

          {/* 4. Atelier Care & Shipping Instructions */}
          <div className="bg-white border border-[#E5DFD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F2ECE3]">
              <Scissors className="w-4 h-4 text-[#8C7355]" />
              <h2 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                Entretien & Expédition Gants Blancs
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Conseils d'Entretien (care_instructions)
                </label>
                <textarea
                  rows={3}
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="Nettoyage à sec spécialisé chez un maître teinturier uniquement..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] leading-relaxed focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Informations de Livraison (shipping_information)
                </label>
                <textarea
                  rows={3}
                  value={shippingInformation}
                  onChange={(e) => setShippingInformation(e.target.value)}
                  placeholder="Expédition sous housse monogrammée ELIF, coursier dédié..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] leading-relaxed focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
            </div>
          </div>

          {/* 5. SEO Metatags */}
          <div className="bg-white border border-[#E5DFD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F2ECE3]">
              <FileText className="w-4 h-4 text-[#8C7355]" />
              <h2 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                Référencement & Métadonnées SEO
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Titre SEO (seo_title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Robe Vespera en Crêpe de Soie | ELIF Haute Couture"
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1.5 font-medium">
                  Description SEO (seo_description)
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Découvrez la création emblématique de la Maison ELIF, façonnée à la main..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right / Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Visibility */}
          <div className="bg-white border border-[#E5DFD5] p-5 space-y-4 shadow-xs">
            <h3 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14] pb-2 border-b border-[#F2ECE3]">
              Statut & Diffusion
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Statut de Publication
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                >
                  <option value="draft">Brouillon (Atelier)</option>
                  <option value="active">Actif (En Ligne)</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#F2ECE3] flex items-center justify-between">
                <div>
                  <span className="font-fashion text-[9.5px] uppercase tracking-wider text-[#0A1C14] block font-medium">
                    Mise en Avant (Featured)
                  </span>
                  <span className="text-[11px] text-[#7A7162]">Sélection haute couture</span>
                </div>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#0A1C14] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Badge Éditorial (badge)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Nouveauté, Pièce Unique, Défilé..."
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Maison / Marque (brand)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="ELIF"
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
            </div>
          </div>

          {/* Categories Assignment */}
          <div className="bg-white border border-[#E5DFD5] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
              <h3 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                Catégories
              </h3>
              <Link
                to="/admin/catalog/categories"
                className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14]"
              >
                Gérer
              </Link>
            </div>

            {availableCategories.length === 0 ? (
              <p className="font-serif italic text-xs text-[#8A8172]">
                Aucune catégorie enregistrée dans la base.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 p-1.5 hover:bg-[#FAF8F5] cursor-pointer text-xs font-sans text-[#332E27]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="accent-[#0A1C14] cursor-pointer"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Collections Assignment */}
          <div className="bg-white border border-[#E5DFD5] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
              <h3 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                Collections
              </h3>
              <Link
                to="/admin/catalog/collections"
                className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14]"
              >
                Gérer
              </Link>
            </div>

            {availableCollections.length === 0 ? (
              <p className="font-serif italic text-xs text-[#8A8172]">
                Aucune collection enregistrée dans la base.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableCollections.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2.5 p-1.5 hover:bg-[#FAF8F5] cursor-pointer text-xs font-sans text-[#332E27]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollectionIds.includes(col.id)}
                      onChange={() => toggleCollection(col.id)}
                      className="accent-[#0A1C14] cursor-pointer"
                    />
                    <span>{col.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Materials Assignment */}
          <div className="bg-white border border-[#E5DFD5] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE3]">
              <h3 className="font-fashion text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1C14]">
                Matières & Étoffes
              </h3>
              <Link
                to="/admin/catalog/materials"
                className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14]"
              >
                Gérer
              </Link>
            </div>

            {availableMaterials.length === 0 ? (
              <p className="font-serif italic text-xs text-[#8A8172]">
                Aucune matière enregistrée dans la base.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableMaterials.map((mat) => (
                  <label
                    key={mat.id}
                    className="flex items-center gap-2.5 p-1.5 hover:bg-[#FAF8F5] cursor-pointer text-xs font-sans text-[#332E27]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterialIds.includes(mat.id)}
                      onChange={() => toggleMaterial(mat.id)}
                      className="accent-[#0A1C14] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span>{mat.name}</span>
                      {mat.origin && (
                        <span className="text-[10px] text-[#8C7355] font-serif italic">
                          Provenance : {mat.origin}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
