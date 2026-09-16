import { supabase } from '../lib/supabase';
import { Customer, CustomerAddress, Order } from '../types';
import { activityLogService } from './activityLogService';

export interface CustomerFilters {
  search?: string;
  accountType?: 'all' | 'registered' | 'guest';
  sortBy?: 'created_at' | 'full_name' | 'orders_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const customerService = {
  /**
   * Fetches paginated customers with aggregated orders and address counts
   */
  async getCustomers(filters: CustomerFilters = {}) {
    const {
      search,
      accountType = 'all',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 15,
    } = filters;

    let query = supabase
      .from('customers')
      .select(
        `
        *,
        customer_addresses (id, city, country, is_default, address_type),
        orders (id, total_amount, order_status, created_at)
      `,
        { count: 'exact' }
      );

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
    }

    if (accountType === 'registered') {
      query = query.not('user_id', 'is', null);
    } else if (accountType === 'guest') {
      query = query.is('user_id', null);
    }

    if (sortBy === 'created_at' || sortBy === 'full_name') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error };
    }

    // Process computed attributes (total_orders, total_spent, last_order_at)
    const processed: Customer[] = (data || []).map((c: any) => {
      const orders: Order[] = c.orders || [];
      const total_spent = orders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0);
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const last_order_at = sortedOrders.length > 0 ? sortedOrders[0].created_at : null;

      return {
        ...c,
        total_orders: orders.length,
        total_spent,
        last_order_at,
      };
    });

    // If client requested sort by orders_count
    if (sortBy === 'orders_count') {
      processed.sort((a, b) => {
        const diff = (a.total_orders || 0) - (b.total_orders || 0);
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return {
      data: processed,
      count: count || 0,
      error: null,
    };
  },

  /**
   * Fetches deep customer profile, including addresses, order history, and saved wishlist
   */
  async getCustomerById(id: string) {
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select(
        `
        *,
        customer_addresses (*),
        orders (
          *,
          order_items (*),
          payments (id, status, amount, payment_method)
        )
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (custErr || !customer) {
      return { data: null, wishlist: [], error: custErr || new Error('Client introuvable') };
    }

    // Sort customer orders by created_at desc
    if (customer.orders) {
      customer.orders.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // Compute metrics
    const total_orders = customer.orders ? customer.orders.length : 0;
    const total_spent = (customer.orders || []).reduce(
      (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
      0
    );

    // Fetch wishlist items if table exists
    let wishlistItems: any[] = [];
    try {
      const { data: wlData } = await supabase
        .from('wishlists')
        .select('id')
        .eq('customer_id', id)
        .maybeSingle();

      if (wlData?.id) {
        const { data: items } = await supabase
          .from('wishlist_items')
          .select(`
            id,
            product_id,
            created_at,
            products (id, name, slug, price, product_images(image_url, is_primary))
          `)
          .eq('wishlist_id', wlData.id);

        wishlistItems = items || [];
      }
    } catch (wlErr) {
      // Wishlist non-blocking
      console.warn('Could not load customer wishlist:', wlErr);
    }

    const processedCustomer: Customer = {
      ...customer,
      total_orders,
      total_spent,
      last_order_at: customer.orders?.[0]?.created_at || null,
    };

    return {
      data: processedCustomer,
      wishlist: wishlistItems,
      error: null,
    };
  },

  /**
   * Updates customer identity and contact coordinates
   */
  async updateCustomerProfile(params: {
    customerId: string;
    fullName: string;
    phone?: string;
    email?: string;
    adminUserId?: string | null;
  }) {
    const { customerId, fullName, phone, email, adminUserId } = params;

    const { error } = await supabase
      .from('customers')
      .update({
        full_name: fullName.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (error) return { success: false, error };

    await activityLogService.log({
      action: 'customer.profile_update',
      entity_type: 'customers',
      entity_id: customerId,
      description: `Mise à jour des coordonnées du client ${fullName}`,
      metadata: { full_name: fullName, phone, email },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },

  /**
   * Updates an existing customer address
   */
  async updateCustomerAddress(params: {
    addressId: string;
    customerId: string;
    data: Partial<CustomerAddress>;
    adminUserId?: string | null;
  }) {
    const { addressId, customerId, data, adminUserId } = params;

    const payload: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    delete payload.id;
    delete payload.customer_id;
    delete payload.created_at;

    const { error } = await supabase.from('customer_addresses').update(payload).eq('id', addressId);
    if (error) return { success: false, error };

    await activityLogService.log({
      action: 'customer.address_update',
      entity_type: 'customers',
      entity_id: customerId,
      description: `Adresse mise à jour pour le client #${customerId}`,
      metadata: { addressId, ...payload },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },

  /**
   * Adds a new address to the customer's book
   */
  async createCustomerAddress(params: {
    customerId: string;
    data: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>;
    adminUserId?: string | null;
  }) {
    const { customerId, data, adminUserId } = params;

    const { data: created, error } = await supabase
      .from('customer_addresses')
      .insert([
        {
          customer_id: customerId,
          recipient_name: data.recipient_name,
          phone: data.phone || null,
          address_line: data.address_line,
          city: data.city,
          district: data.district || null,
          postal_code: data.postal_code || null,
          country: data.country || 'France',
          address_type: data.address_type || 'shipping',
          is_default: Boolean(data.is_default),
        },
      ])
      .select()
      .single();

    if (error) return { success: false, error };

    await activityLogService.log({
      action: 'customer.address_create',
      entity_type: 'customers',
      entity_id: customerId,
      description: `Nouvelle adresse enregistrée pour le client #${customerId}`,
      metadata: { addressId: created?.id },
      userId: adminUserId,
    });

    return { success: true, data: created, error: null };
  },
};
