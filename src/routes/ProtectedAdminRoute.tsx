import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactElement;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, adminProfile, loading, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If authenticated in Supabase Auth but lacks an active admin profile, sign out immediately
    if (!loading && user && !adminProfile) {
      signOut();
    }
  }, [loading, user, adminProfile, signOut]);

  // Only display blocking loader during initial cold-start if user is not loaded yet
  if (loading && !user) {
    return (
      <div id="admin-auth-loading" className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-[#1A1A1A] p-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="font-brand text-3xl md:text-4xl tracking-[0.25em] font-light text-[#0A1C14] mb-2">
            ELIF
          </div>
          <p className="text-[10px] font-fashion uppercase tracking-[0.25em] text-[#7A7162] mb-8">
            Maison de Haute Couture
          </p>
          <div className="w-32 h-[1.5px] bg-[#E5DFD5] overflow-hidden relative mb-4">
            <div className="w-12 h-full bg-[#0A1C14] absolute top-0 left-0 animate-pulse" />
          </div>
          <p className="text-xs font-fashion text-[#544D42] tracking-widest uppercase font-medium">
            Vérification de la session administrateur...
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users -> redirect to /admin/login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated but non-admin users -> deny access, sign out, redirect to /admin/login with notice
  if (!adminProfile) {
    return (
      <Navigate
        to="/admin/login"
        state={{
          from: location,
          deniedReason: `Access Denied: Account (${user.email || user.id}) does not have an active administrator profile in public.admin_users.`
        }}
        replace
      />
    );
  }

  // 3. Authenticated active admins -> render protected content
  return children;
};
