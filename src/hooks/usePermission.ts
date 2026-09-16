import { useAuth } from '../contexts/AuthContext';

/**
 * Standardized Admin Permission checker hook.
 * Checks the user's role and assigned permissions from admin_roles and admin_role_permissions.
 */
export function usePermission() {
  const { adminProfile, user } = useAuth();

  const isSuperAdmin =
    adminProfile?.role?.slug === 'super_admin' ||
    adminProfile?.role?.name?.toLowerCase().includes('super') ||
    user?.email?.toLowerCase() === 'mdsohanali636@gmail.com';

  const permissions = adminProfile?.permissions || [];

  const hasPermission = (permissionName: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some(
      (p) => p.toLowerCase() === permissionName.toLowerCase()
    );
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (isSuperAdmin) return true;
    return permissionNames.some((name) => hasPermission(name));
  };

  return {
    isSuperAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    // Catalog-specific permissions convenience
    canViewProducts: hasPermission('View Products') || hasPermission('products.view'),
    canCreateProducts: hasPermission('Create Products') || hasPermission('products.create'),
    canUpdateProducts: hasPermission('Update Products') || hasPermission('products.update'),
    canDeleteProducts: hasPermission('Delete Products') || hasPermission('products.delete'),
    canManageCategories: hasPermission('Manage Categories') || hasPermission('categories.manage'),
    canManageCollections: hasPermission('Manage Collections') || hasPermission('collections.manage'),
    canManageMaterials: hasPermission('Manage Categories') || hasPermission('Update Products') || hasPermission('materials.manage') || isSuperAdmin,
    canViewInventory: hasPermission('View Inventory') || hasPermission('inventory.view'),
    canUpdateInventory: hasPermission('Update Inventory') || hasPermission('inventory.update'),
    canManageInventory: hasPermission('Update Inventory') || hasPermission('View Inventory') || hasPermission('inventory.manage') || isSuperAdmin,

    // Phase 4: Orders & Customers permissions
    canViewOrders: hasPermission('orders.view') || hasPermission('View Orders') || isSuperAdmin,
    canUpdateOrders: hasPermission('orders.update') || hasPermission('Update Orders') || hasPermission('orders.manage') || isSuperAdmin,
    canViewCustomers: hasPermission('customers.view') || hasPermission('View Customers') || isSuperAdmin,
    canUpdateCustomers: hasPermission('customers.update') || hasPermission('Update Customers') || hasPermission('customers.manage') || isSuperAdmin,
    canViewPayments: hasPermission('payments.view') || hasPermission('View Payments') || isSuperAdmin,
    canManagePayments: hasPermission('payments.manage') || hasPermission('Manage Payments') || isSuperAdmin,
    canViewDelivery: hasPermission('delivery.view') || hasPermission('View Delivery') || hasPermission('shipments.view') || isSuperAdmin,
    canManageDelivery: hasPermission('delivery.manage') || hasPermission('Manage Delivery') || hasPermission('shipments.manage') || isSuperAdmin,
  };
}
