import { supabase } from '../lib/supabase';
import {
  Product,
  Category,
  Collection,
  ProductMaterial,
  ProductVariant,
  ProductImage,
  InventoryRecord,
} from '../types';

export interface ProductFilters {
  search?: string;
  status?: string;
  featured?: boolean | null;
  categoryId?: string;
  sortBy?: 'created_at' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const catalogService = {
  // ==========================================
  // PRODUCTS
  // ==========================================
  async getProducts(filters: ProductFilters = {}) {
    const {
      search,
      status,
      featured,
      categoryId,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 12,
    } = filters;

    let query = supabase
      .from('products')
      .select(
        `
        *,
        product_images (id, product_id, image_url, alt_text, sort_order, is_primary, created_at),
        product_variants (id, sku, size, color, color_hex, price, compare_at_price, is_active, inventory(quantity, low_stock_threshold)),
        product_categories (category_id, categories(id, name, slug)),
        product_collections (collection_id, collections(id, name, slug)),
        product_material_map (material_id, product_materials(id, name, origin))
      `,
        { count: 'exact' }
      );

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`name.ilike.%${s}%,product_code.ilike.%${s}%,slug.ilike.%${s}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (featured !== null && featured !== undefined) {
      query = query.eq('featured', featured);
    }

    if (categoryId && categoryId !== 'all') {
      // Find products matching category_id
      const { data: matchedRelations } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryId);

      const pids = (matchedRelations || []).map((r) => r.product_id);
      if (pids.length === 0) {
        return { data: [], count: 0, error: null };
      }
      query = query.in('id', pids);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    return { data: (data as Product[]) || [], count: count || 0, error };
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (*),
        product_variants (*),
        product_categories (category_id, categories(*)),
        product_collections (collection_id, collections(*)),
        product_material_map (material_id, product_materials(*))
      `
      )
      .eq('id', id)
      .single();

    return { data: data as Product | null, error };
  },

  async createProduct(
    productData: Partial<Product>,
    meta?: {
      categoryIds?: string[];
      collectionIds?: string[];
      materialIds?: string[];
      images?: { image_url: string; alt_text?: string; sort_order: number; is_primary: boolean }[];
      variants?: Partial<ProductVariant>[];
    }
  ) {
    // 1. Insert into products
    const { data: newProd, error: prodErr } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        slug: productData.slug,
        product_code: productData.product_code || null,
        description: productData.description || null,
        short_description: productData.short_description || null,
        price: productData.price || 0,
        compare_at_price: productData.compare_at_price || null,
        currency: productData.currency || 'BDT',
        status: productData.status || 'draft',
        featured: Boolean(productData.featured),
        badge: productData.badge || null,
        brand: productData.brand || 'ELIF',
        care_instructions: productData.care_instructions || null,
        shipping_information: productData.shipping_information || null,
        seo_title: productData.seo_title || null,
        seo_description: productData.seo_description || null,
      })
      .select()
      .single();

    if (prodErr || !newProd) {
      return { data: null, error: prodErr };
    }

    const productId = newProd.id;

    // 2. Associate categories
    if (meta?.categoryIds && meta.categoryIds.length > 0) {
      const rows = meta.categoryIds.map((cid) => ({
        product_id: productId,
        category_id: cid,
      }));
      await supabase.from('product_categories').insert(rows);
    }

    // 3. Associate collections
    if (meta?.collectionIds && meta.collectionIds.length > 0) {
      const rows = meta.collectionIds.map((cid) => ({
        product_id: productId,
        collection_id: cid,
      }));
      await supabase.from('product_collections').insert(rows);
    }

    // 4. Associate materials
    if (meta?.materialIds && meta.materialIds.length > 0) {
      const rows = meta.materialIds.map((mid) => ({
        product_id: productId,
        material_id: mid,
      }));
      await supabase.from('product_material_map').insert(rows);
    }

    // 5. Insert images
    if (meta?.images && meta.images.length > 0) {
      const rows = meta.images.map((img, idx) => ({
        product_id: productId,
        image_url: img.image_url,
        alt_text: img.alt_text || null,
        sort_order: img.sort_order ?? idx,
        is_primary: Boolean(img.is_primary),
      }));
      await supabase.from('product_images').insert(rows);
    }

    // 6. Insert variants (sizes)
    if (meta?.variants && meta.variants.length > 0) {
      for (const v of meta.variants) {
        const { data: vRecord } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: v.sku || null,
            size: v.size || null,
            color: v.color || null,
            color_hex: v.color_hex || null,
            price: v.price || null,
            compare_at_price: v.compare_at_price || null,
            is_active: v.is_active !== false,
          })
          .select()
          .single();

        // Optional inventory initialization
        if (vRecord) {
          const qty = (v as any).quantity !== undefined ? (v as any).quantity : 0;
          await supabase.from('inventory').insert({
            product_id: productId,
            variant_id: vRecord.id,
            quantity: qty,
            low_stock_threshold: 5,
          });
        }
      }
    }

    return { data: newProd as Product, error: null };
  },

  async updateProduct(
    id: string,
    productData: Partial<Product>,
    meta?: {
      categoryIds?: string[];
      collectionIds?: string[];
      materialIds?: string[];
      images?: Array<{ id?: string; image_url: string; alt_text?: string; sort_order: number; is_primary: boolean }>;
      variants?: Array<Partial<ProductVariant> & { quantity?: number }>;
    }
  ) {
    const { data: updated, error } = await supabase
      .from('products')
      .update({
        ...productData,
        currency: productData.currency || 'BDT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };

    // Update category associations if provided
    if (meta?.categoryIds !== undefined) {
      await supabase.from('product_categories').delete().eq('product_id', id);
      if (meta.categoryIds.length > 0) {
        const rows = meta.categoryIds.map((cid) => ({
          product_id: id,
          category_id: cid,
        }));
        await supabase.from('product_categories').insert(rows);
      }
    }

    // Update collection associations if provided
    if (meta?.collectionIds !== undefined) {
      await supabase.from('product_collections').delete().eq('product_id', id);
      if (meta.collectionIds.length > 0) {
        const rows = meta.collectionIds.map((cid) => ({
          product_id: id,
          collection_id: cid,
        }));
        await supabase.from('product_collections').insert(rows);
      }
    }

    // Update material associations if provided
    if (meta?.materialIds !== undefined) {
      await supabase.from('product_material_map').delete().eq('product_id', id);
      if (meta.materialIds.length > 0) {
        const rows = meta.materialIds.map((mid) => ({
          product_id: id,
          material_id: mid,
        }));
        await supabase.from('product_material_map').insert(rows);
      }
    }

    // Update images if provided
    if (meta?.images !== undefined) {
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', id);

      const existingIds = new Set((existingImages || []).map((img) => img.id));
      const incomingIds = new Set(meta.images.filter((img) => img.id).map((img) => img.id));

      // 1. Delete removed images
      for (const existingId of existingIds) {
        if (!incomingIds.has(existingId)) {
          await supabase.from('product_images').delete().eq('id', existingId);
        }
      }

      // 2. Insert new or update existing
      for (let idx = 0; idx < meta.images.length; idx++) {
        const img = meta.images[idx];
        if (img.id && existingIds.has(img.id)) {
          await supabase
            .from('product_images')
            .update({
              image_url: img.image_url,
              alt_text: img.alt_text || null,
              sort_order: img.sort_order ?? idx,
              is_primary: Boolean(img.is_primary),
            })
            .eq('id', img.id);
        } else {
          await supabase.from('product_images').insert({
            product_id: id,
            image_url: img.image_url,
            alt_text: img.alt_text || null,
            sort_order: img.sort_order ?? idx,
            is_primary: Boolean(img.is_primary),
          });
        }
      }
    }

    // Update variants (sizes) if provided
    if (meta?.variants !== undefined) {
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id);

      const existingVarIds = new Set((existingVariants || []).map((v) => v.id));
      const incomingVarIds = new Set(meta.variants.filter((v) => v.id).map((v) => v.id));

      // 1. Delete removed variants
      for (const existingId of existingVarIds) {
        if (!incomingVarIds.has(existingId)) {
          await supabase.from('inventory').delete().eq('variant_id', existingId);
          await supabase.from('product_variants').delete().eq('id', existingId);
        }
      }

      // 2. Insert new or update existing variants
      for (const v of meta.variants) {
        if (v.id && existingVarIds.has(v.id)) {
          await supabase
            .from('product_variants')
            .update({
              size: v.size || null,
              sku: v.sku || null,
              color: v.color || null,
              color_hex: v.color_hex || null,
              price: v.price || null,
              compare_at_price: v.compare_at_price || null,
              is_active: v.is_active !== false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', v.id);

          if (v.quantity !== undefined) {
            const { data: invRow } = await supabase
              .from('inventory')
              .select('id')
              .eq('variant_id', v.id)
              .maybeSingle();

            if (invRow) {
              await supabase
                .from('inventory')
                .update({ quantity: v.quantity, updated_at: new Date().toISOString() })
                .eq('id', invRow.id);
            } else {
              await supabase.from('inventory').insert({
                product_id: id,
                variant_id: v.id,
                quantity: v.quantity,
                low_stock_threshold: 5,
              });
            }
          }
        } else {
          const { data: newV } = await supabase
            .from('product_variants')
            .insert({
              product_id: id,
              sku: v.sku || null,
              size: v.size || null,
              color: v.color || null,
              color_hex: v.color_hex || null,
              price: v.price || null,
              compare_at_price: v.compare_at_price || null,
              is_active: v.is_active !== false,
            })
            .select()
            .single();

          if (newV) {
            const qty = v.quantity !== undefined ? v.quantity : 0;
            await supabase.from('inventory').insert({
              product_id: id,
              variant_id: newV.id,
              quantity: qty,
              low_stock_threshold: 5,
            });
          }
        }
      }
    }

    return { data: updated as Product, error: null };
  },

  async isProductCodeUnique(productCode: string, excludeProductId?: string): Promise<boolean> {
    if (!productCode || !productCode.trim()) return true;
    let query = supabase
      .from('products')
      .select('id')
      .eq('product_code', productCode.trim());

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) return true;
    return !data;
  },

  async archiveOrDeleteProduct(id: string, hardDelete = false) {
    if (hardDelete) {
      // Cascade delete relationships first
      await supabase.from('product_images').delete().eq('product_id', id);
      await supabase.from('inventory').delete().eq('product_id', id);
      await supabase.from('product_variants').delete().eq('product_id', id);
      await supabase.from('product_categories').delete().eq('product_id', id);
      await supabase.from('product_collections').delete().eq('product_id', id);
      await supabase.from('product_material_map').delete().eq('product_id', id);
      return await supabase.from('products').delete().eq('id', id);
    } else {
      // Soft-archive by switching status to 'archived'
      return await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);
    }
  },

  // ==========================================
  // PRODUCT IMAGES
  // ==========================================
  async getProductImages(productId: string) {
    return await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
  },

  async addProductImage(
    productId: string,
    imageUrl: string,
    altText?: string,
    isPrimary = false,
    sortOrder = 0
  ) {
    if (isPrimary) {
      // Demote existing primary images
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }
    return await supabase.from('product_images').insert({
      product_id: productId,
      image_url: imageUrl,
      alt_text: altText || null,
      sort_order: sortOrder,
      is_primary: isPrimary,
    });
  },

  async deleteProductImage(imageId: string) {
    return await supabase.from('product_images').delete().eq('id', imageId);
  },

  async setPrimaryImage(productId: string, imageId: string) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    return await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);
  },

  // ==========================================
  // PRODUCT VARIANTS
  // ==========================================
  async getProductVariants(productId: string) {
    return await supabase
      .from('product_variants')
      .select('*, inventory(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
  },

  async addVariant(
    productId: string,
    variantData: {
      size?: string;
      color?: string;
      color_hex?: string;
      sku?: string;
      price?: number;
      compare_at_price?: number;
      is_active?: boolean;
      quantity?: number;
    }
  ) {
    const { data: vRecord, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        size: variantData.size || null,
        color: variantData.color || null,
        color_hex: variantData.color_hex || null,
        sku: variantData.sku || null,
        price: variantData.price || null,
        compare_at_price: variantData.compare_at_price || null,
        is_active: variantData.is_active !== false,
      })
      .select()
      .single();

    if (error || !vRecord) return { data: null, error };

    if (variantData.quantity !== undefined) {
      await supabase.from('inventory').insert({
        product_id: productId,
        variant_id: vRecord.id,
        quantity: variantData.quantity || 0,
        low_stock_threshold: 5,
      });
    }

    return { data: vRecord, error: null };
  },

  async updateVariant(
    variantId: string,
    variantData: Partial<ProductVariant> & { quantity?: number }
  ) {
    const { error } = await supabase
      .from('product_variants')
      .update({
        size: variantData.size,
        color: variantData.color,
        color_hex: variantData.color_hex,
        sku: variantData.sku,
        price: variantData.price,
        compare_at_price: variantData.compare_at_price,
        is_active: variantData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);

    if (error) return { error };

    if (variantData.quantity !== undefined) {
      const { data: existingInv } = await supabase
        .from('inventory')
        .select('id')
        .eq('variant_id', variantId)
        .maybeSingle();

      if (existingInv) {
        await supabase
          .from('inventory')
          .update({
            quantity: variantData.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingInv.id);
      }
    }

    return { error: null };
  },

  async deleteVariant(variantId: string) {
    await supabase.from('inventory').delete().eq('variant_id', variantId);
    return await supabase.from('product_variants').delete().eq('id', variantId);
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories() {
    return await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
  },

  async createCategory(cat: {
    name: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
    sort_order?: number;
    image_url?: string;
  }) {
    const slug =
      cat.slug?.trim() ||
      cat.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    return await supabase
      .from('categories')
      .insert({
        name: cat.name.trim(),
        slug,
        description: cat.description || null,
        is_active: cat.is_active ?? true,
        sort_order: cat.sort_order ?? 0,
        image_url: cat.image_url || null,
      })
      .select()
      .single();
  },

  async updateCategory(
    id: string,
    cat: Partial<Category>
  ) {
    return await supabase
      .from('categories')
      .update({
        ...cat,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteCategory(id: string) {
    // Check if products are linked
    const { count } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw new Error(
        `Impossible de supprimer cette catégorie : ${count} produit(s) y sont actuellement rattaché(s). Veuillez d'abord détacher les produits ou désactiver la catégorie.`
      );
    }

    return await supabase.from('categories').delete().eq('id', id);
  },

  // ==========================================
  // COLLECTIONS
  // ==========================================
  async getCollections() {
    return await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true });
  },

  async createCollection(col: {
    name: string;
    slug: string;
    description?: string;
    status?: string;
    featured?: boolean;
    sort_order?: number;
    image_url?: string;
  }) {
    return await supabase.from('collections').insert({
      name: col.name,
      slug: col.slug,
      description: col.description || null,
      status: col.status || 'active',
      featured: Boolean(col.featured),
      sort_order: col.sort_order ?? 0,
      image_url: col.image_url || null,
    }).select().single();
  },

  async updateCollection(id: string, col: Partial<Collection>) {
    return await supabase
      .from('collections')
      .update({
        ...col,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteCollection(id: string) {
    // Detach relationships safely
    await supabase.from('product_collections').delete().eq('collection_id', id);
    return await supabase.from('collections').delete().eq('id', id);
  },

  // ==========================================
  // MATERIALS
  // ==========================================
  async getMaterials() {
    return await supabase
      .from('product_materials')
      .select('*')
      .order('name', { ascending: true });
  },

  async createMaterial(mat: {
    name: string;
    origin?: string;
    description?: string;
    is_active?: boolean;
  }) {
    return await supabase.from('product_materials').insert({
      name: mat.name,
      origin: mat.origin || null,
      description: mat.description || null,
      is_active: mat.is_active ?? true,
    }).select().single();
  },

  async updateMaterial(id: string, mat: Partial<ProductMaterial>) {
    return await supabase
      .from('product_materials')
      .update({
        name: mat.name,
        origin: mat.origin,
        description: mat.description,
        is_active: mat.is_active,
      })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteMaterial(id: string) {
    const { count } = await supabase
      .from('product_material_map')
      .select('*', { count: 'exact', head: true })
      .eq('material_id', id);

    if (count && count > 0) {
      throw new Error(
        `Impossible de supprimer ce matériau : ${count} produit(s) l'utilisent. Veuillez désactiver le matériau à la place.`
      );
    }

    return await supabase.from('product_materials').delete().eq('id', id);
  },
};
