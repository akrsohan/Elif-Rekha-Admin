import { supabase } from '../lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { activityLogService } from './activityLogService';

export interface OrderFilters {
  search?: string;
  order_status?: string;
  payment_status?: string;
  datePreset?: 'all' | 'today' | '7days' | '30days' | 'custom';
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'total_amount' | 'order_number';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; colorClass: string; desc: string }[] = [
  { value: 'pending', label: 'En attente', colorClass: 'bg-amber-50 text-amber-800 border-amber-200', desc: 'Commande reçue, en attente de confirmation' },
  { value: 'confirmed', label: 'Confirmée', colorClass: 'bg-sky-50 text-sky-800 border-sky-200', desc: 'Validée par la direction de la Maison' },
  { value: 'processing', label: 'En confection', colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200', desc: 'En cours de préparation dans l’atelier' },
  { value: 'packed', label: 'Conditionnée', colorClass: 'bg-teal-50 text-teal-800 border-teal-200', desc: 'Coffret signature scellé et prêt à l’envoi' },
  { value: 'shipped', label: 'Expédiée', colorClass: 'bg-purple-50 text-purple-800 border-purple-200', desc: 'Prise en charge par le service coursier' },
  { value: 'delivered', label: 'Livrée', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200', desc: 'Remise en main propre au destinataire' },
  { value: 'cancelled', label: 'Annulée', colorClass: 'bg-stone-100 text-stone-600 border-stone-300', desc: 'Annulation demandée ou non finalisée' },
  { value: 'returned', label: 'Retournée', colorClass: 'bg-orange-50 text-orange-800 border-orange-200', desc: 'Retour de pièce réceptionné à l’atelier' },
  { value: 'exchanged', label: 'Échangée', colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200', desc: 'Ajustement ou substitution de taille effectuée' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; colorClass: string }[] = [
  { value: 'pending', label: 'En attente', colorClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'paid', label: 'Règlement validé', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'failed', label: 'Échec de paiement', colorClass: 'bg-rose-50 text-rose-800 border-rose-200' },
  { value: 'refunded', label: 'Remboursé', colorClass: 'bg-stone-100 text-stone-700 border-stone-300' },
  { value: 'partially_refunded', label: 'Remboursement partiel', colorClass: 'bg-orange-50 text-orange-800 border-orange-200' },
];

export const orderService = {
  /**
   * Fetches paginated orders with customer, addresses, payment, and shipment status
   */
  async getOrders(filters: OrderFilters = {}) {
    const {
      search,
      order_status,
      payment_status,
      datePreset = 'all',
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 15,
    } = filters;

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        customers (id, full_name, phone, email, user_id),
        order_items (id, product_name, quantity, total_price, sku, size, color),
        order_addresses (id, recipient_name, phone, city, district, postal_code, country),
        payments (id, status, payment_method, provider, amount),
        shipments (id, status, courier_name, tracking_number)
      `,
        { count: 'exact' }
      );

    // Search filter
    if (search && search.trim()) {
      const s = search.trim();
      // Search by order_number directly
      query = query.or(`order_number.ilike.%${s}%,customer_notes.ilike.%${s}%`);
    }

    // Order status filter
    if (order_status && order_status !== 'all') {
      query = query.eq('order_status', order_status);
    }

    // Payment status filter
    if (payment_status && payment_status !== 'all') {
      query = query.eq('payment_status', payment_status);
    }

    // Date filters
    const now = new Date();
    if (datePreset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', todayStart);
    } else if (datePreset === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', sevenDaysAgo);
    } else if (datePreset === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyDaysAgo);
    } else if (datePreset === 'custom') {
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        // Set end of the specified day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    return {
      data: (data as Order[]) || [],
      count: count || 0,
      error,
    };
  },

  /**
   * Fetches full order detail by ID including items, addresses, history, payments, and shipments
   */
  async getOrderById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        customers (*),
        order_items (*),
        order_addresses (*),
        order_status_history (*),
        payments (
          *,
          payment_transactions (*)
        ),
        shipments (
          *,
          delivery_zones (*)
        )
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (data && data.order_status_history) {
      // Sort status history by created_at desc
      data.order_status_history.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return { data: data as Order | null, error: null };
  },

  /**
   * Updates an order's status and logs the transition in order_status_history and activity_logs
   */
  async updateOrderStatus(params: {
    orderId: string;
    newStatus: OrderStatus;
    note?: string;
    adminUserId?: string | null;
  }) {
    const { orderId, newStatus, note, adminUserId } = params;

    // 1. Fetch current status
    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('order_status, order_number')
      .eq('id', orderId)
      .single();

    if (fetchErr) {
      return { success: false, error: fetchErr };
    }

    const oldStatus = currentOrder?.order_status || 'pending';

    // 2. Update orders table
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr };
    }

    // 3. Insert into order_status_history
    const { error: histErr } = await supabase.from('order_status_history').insert([
      {
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        note: note ? note.trim() : null,
        changed_by: adminUserId || null,
      },
    ]);

    if (histErr) {
      console.warn('Could not insert order_status_history record:', histErr.message);
    }

    // 4. Log admin activity
    await activityLogService.log({
      action: 'order.status_update',
      entity_type: 'orders',
      entity_id: orderId,
      description: `Statut de la commande #${currentOrder?.order_number || orderId} modifié : ${oldStatus} ➔ ${newStatus}`,
      metadata: {
        order_number: currentOrder?.order_number,
        old_status: oldStatus,
        new_status: newStatus,
        note: note || null,
      },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },

  /**
   * Adds an internal audit note to order_status_history without modifying the status
   */
  async addInternalOrderNote(params: {
    orderId: string;
    note: string;
    adminUserId?: string | null;
  }) {
    const { orderId, note, adminUserId } = params;

    const { data: currentOrder } = await supabase
      .from('orders')
      .select('order_status, order_number')
      .eq('id', orderId)
      .single();

    const status = currentOrder?.order_status || 'pending';

    const { error: histErr } = await supabase.from('order_status_history').insert([
      {
        order_id: orderId,
        old_status: status,
        new_status: status,
        note: note.trim(),
        changed_by: adminUserId || null,
      },
    ]);

    if (histErr) {
      return { success: false, error: histErr };
    }

    await activityLogService.log({
      action: 'order.internal_note',
      entity_type: 'orders',
      entity_id: orderId,
      description: `Note interne ajoutée à la commande #${currentOrder?.order_number || orderId}`,
      metadata: { note: note.trim() },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },

  /**
   * Updates payment record details & records status
   */
  async updatePaymentRecord(params: {
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    provider?: string;
    paymentMethod?: string;
    adminUserId?: string | null;
  }) {
    const { paymentId, orderId, status, provider, paymentMethod, adminUserId } = params;

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (provider) updatePayload.provider = provider;
    if (paymentMethod) updatePayload.payment_method = paymentMethod;
    if (status === 'paid') {
      updatePayload.paid_at = new Date().toISOString();
    }

    const { error: pErr } = await supabase.from('payments').update(updatePayload).eq('id', paymentId);
    if (pErr) return { success: false, error: pErr };

    // Also sync orders.payment_status
    await supabase
      .from('orders')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await activityLogService.log({
      action: 'payment.status_update',
      entity_type: 'payments',
      entity_id: paymentId,
      description: `Mise à jour du statut de paiement pour la commande : ${status}`,
      metadata: { order_id: orderId, status, provider },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },

  /**
   * Updates shipment tracking & delivery details
   */
  async updateShipmentRecord(params: {
    shipmentId: string;
    orderId: string;
    status: string;
    courier_name?: string;
    tracking_number?: string;
    tracking_url?: string;
    estimated_delivery_date?: string;
    adminUserId?: string | null;
  }) {
    const {
      shipmentId,
      orderId,
      status,
      courier_name,
      tracking_number,
      tracking_url,
      estimated_delivery_date,
      adminUserId,
    } = params;

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (courier_name !== undefined) updatePayload.courier_name = courier_name.trim() || null;
    if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number.trim() || null;
    if (tracking_url !== undefined) updatePayload.tracking_url = tracking_url.trim() || null;
    if (estimated_delivery_date) updatePayload.estimated_delivery_date = estimated_delivery_date;

    if (status === 'shipped') {
      updatePayload.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const { error: sErr } = await supabase.from('shipments').update(updatePayload).eq('id', shipmentId);
    if (sErr) return { success: false, error: sErr };

    await activityLogService.log({
      action: 'shipment.update',
      entity_type: 'shipments',
      entity_id: shipmentId,
      description: `Mise à jour des informations de transport/expédition #${shipmentId}`,
      metadata: { order_id: orderId, courier_name, tracking_number, status },
      userId: adminUserId,
    });

    return { success: true, error: null };
  },
};
