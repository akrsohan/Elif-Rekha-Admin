import { useAuth } from '../contexts/AuthContext';

export const useAdminAuth = () => {
  const auth = useAuth();

  const hasPermission = (permissionCode: string): boolean => {
    if (!auth.adminProfile) return false;
    // Super-admins or users with '*' grant have universal permissions
    if (auth.adminProfile.role?.name?.toLowerCase().includes('super') ||
        auth.adminProfile.permissions.includes('*')) {
      return true;
    }
    return auth.adminProfile.permissions.includes(permissionCode);
  };

  const isActiveAdmin = Boolean(
    auth.user &&
    auth.adminProfile &&
    auth.adminProfile.adminRecord?.status?.toLowerCase() === 'active'
  );

  return {
    ...auth,
    hasPermission,
    isActiveAdmin,
  };
};
