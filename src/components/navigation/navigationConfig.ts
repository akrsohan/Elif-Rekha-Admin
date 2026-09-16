export interface NavItem {
  title: string;
  path: string;
  iconName: string;
  exact?: boolean;
  children?: {
    title: string;
    path: string;
    isAvailable?: boolean;
  }[];
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    iconName: 'Home',
    exact: true,
  },
  {
    title: 'Products',
    path: '/admin/catalog/products',
    iconName: 'Package',
    children: [
      { title: 'All Products', path: '/admin/catalog/products', isAvailable: true },
      { title: 'Inventory', path: '/admin/catalog/inventory', isAvailable: true },
      { title: 'Categories', path: '/admin/catalog/categories', isAvailable: true },
      { title: 'Collections', path: '/admin/catalog/collections', isAvailable: true },
      { title: 'Materials', path: '/admin/catalog/materials', isAvailable: true },
    ],
  },
  {
    title: 'Orders',
    path: '/admin/orders',
    iconName: 'ShoppingBag',
  },
  {
    title: 'Customers',
    path: '/admin/customers',
    iconName: 'Users',
  },
  {
    title: 'Reviews',
    path: '/admin/reviews',
    iconName: 'Star',
  },
  {
    title: 'Coupons',
    path: '/admin/marketing/coupons',
    iconName: 'Ticket',
  },
  {
    title: 'Promotions',
    path: '/admin/marketing/promotions',
    iconName: 'Megaphone',
  },
  {
    title: 'Content',
    path: '/admin/content/homepage',
    iconName: 'FileText',
    children: [
      { title: 'Homepage', path: '/admin/content/homepage', isAvailable: true },
      { title: 'Banners & Lookbook', path: '/admin/content/banners', isAvailable: true },
      { title: 'Site Content', path: '/admin/content/site-content', isAvailable: true },
    ],
  },
  {
    title: 'Atelier',
    path: '/admin/atelier/services',
    iconName: 'Scissors',
    children: [
      { title: 'Services', path: '/admin/atelier/services', isAvailable: true },
      { title: 'Appointments', path: '/admin/atelier/appointments', isAvailable: true },
      { title: 'Tailoring', path: '/admin/atelier/tailoring', isAvailable: true },
    ],
  },
  {
    title: 'Delivery',
    path: '/admin/delivery/methods',
    iconName: 'Truck',
    children: [
      { title: 'Delivery Methods', path: '/admin/delivery/methods', isAvailable: true },
      { title: 'Zones', path: '/admin/delivery/zones', isAvailable: true },
      { title: 'Shipments', path: '/admin/delivery/shipments', isAvailable: true },
    ],
  },
  {
    title: 'Communication',
    path: '/admin/communication/newsletter',
    iconName: 'Mail',
  },
  {
    title: 'Administration',
    path: '/admin/administration/users',
    iconName: 'ShieldCheck',
    children: [
      { title: 'Admin Users', path: '/admin/administration/users', isAvailable: true },
      { title: 'Roles & Permissions', path: '/admin/administration/roles', isAvailable: true },
      { title: 'Activity Logs', path: '/admin/administration/activity-logs', isAvailable: true },
      { title: 'Settings', path: '/admin/administration/settings', isAvailable: true },
    ],
  },
];

