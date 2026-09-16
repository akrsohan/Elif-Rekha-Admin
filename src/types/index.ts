import { User } from '@supabase/supabase-js';

export interface AdminRole {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface AdminRolePermission {
  role_id: string;
  permission_id: string;
  created_at?: string;
  admin_permissions?: AdminPermission | null;
}

export interface AdminUserRecord {
  id: string;
  user_id: string;
  role_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  status: 'active' | 'inactive' | 'suspended' | string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
  admin_roles?: AdminRole | AdminRole[] | null;
}

export interface ActivityLogRecord {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
  metadata?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

export interface AdminAuthProfile {
  authUser: User;
  adminRecord: AdminUserRecord;
  role: AdminRole | null;
  permissions: string[];
}

export interface NavItemChild {
  title: string;
  path: string;
  badge?: string;
  isAvailable?: boolean;
}

export interface NavSection {
  title: string;
  iconName: string;
  children: NavItemChild[];
}

// ==========================================
// Catalog Domain Models (matching Supabase)
// ==========================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  product_code: string | null;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  status: 'draft' | 'active' | 'archived' | string;
  featured: boolean;
  badge: string | null;
  brand: string | null;
  care_instructions: string | null;
  shipping_information: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  product_categories?: { category_id: string; categories?: Category }[];
  product_collections?: { collection_id: string; collections?: Collection }[];
  product_material_map?: { material_id: string; product_materials?: ProductMaterial }[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price: number | null;
  compare_at_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  inventory?: InventoryRecord[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'active' | 'archived' | string;
  featured: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductMaterial {
  id: string;
  name: string;
  origin: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export interface InventoryRecord {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

// ==========================================
// Phase 4: Orders & Customer Domain Models
// ==========================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'exchanged'
  | string;

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | string;

export interface Order {
  id: string;
  customer_id: string | null;
  order_number: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  discount_amount: number;
  currency: string;
  customer_notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  customers?: Customer | null;
  order_items?: OrderItem[];
  order_addresses?: OrderAddress[];
  order_status_history?: OrderStatusHistory[];
  payments?: Payment[];
  shipments?: Shipment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  created_at: string;
}

export interface OrderAddress {
  id: string;
  order_id: string;
  recipient_name: string;
  phone: string | null;
  address_line: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;

  // Joined / computed relations
  customer_addresses?: CustomerAddress[];
  orders?: Order[];
  total_orders?: number;
  total_spent?: number;
  last_order_at?: string | null;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string | null;
  address_line: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  country: string;
  address_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  status: string;
  currency: string;
  payment_method: string | null;
  provider: string | null;
  amount: number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;

  payment_transactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  transaction_id: string | null;
  transaction_type: string | null;
  provider: string | null;
  amount: number;
  status: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  delivery_zone_id: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  estimated_delivery_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;

  delivery_zones?: {
    id: string;
    name: string;
    delivery_fee: number;
  } | null;
}

