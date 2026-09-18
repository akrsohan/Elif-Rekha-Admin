import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminAuthProfile, AdminRole, AdminUserRecord } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminProfile: AdminAuthProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshAdminProfile: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminAuthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  /**
   * Verifies that an authenticated Supabase user exists in `public.admin_users`
   * and holds an 'active' status, loading their assigned role and permissions.
   */
  const verifyAndLoadAdminProfile = useCallback(async (authUser: User): Promise<AdminAuthProfile | null> => {
    try {
      // 1. Check public.admin_users using the authenticated user's UUID
      const { data: adminRecord, error: userError } = await supabase
        .from('admin_users')
        .select('id, user_id, full_name, phone, status, role_id, created_at, updated_at, last_login_at, admin_roles(id, name, slug, description, is_active)')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (userError) {
        console.warn('Error querying public.admin_users:', userError);
      }

      // 2. Validate admin record existence
      if (!adminRecord) {
        // Unlinked or non-admin user attempting to enter admin application
        await supabase.auth.signOut();
        setAuthError(
          `Access Denied: Account (${authUser.email || authUser.id}) does not have an active administrator profile in public.admin_users.`
        );
        return null;
      }

      // 3. Verify active status
      const status = (adminRecord.status || '').trim().toLowerCase();
      if (status !== 'active') {
        await supabase.auth.signOut();
        setAuthError(
          `Access Denied: Administrator account is currently ${status || 'inactive'}. An active status is required to enter the ELIF Admin portal.`
        );
        return null;
      }

      // 4. Load assigned admin role
      const rawRole = (adminRecord as any).admin_roles;
      let role: AdminRole | null = Array.isArray(rawRole)
        ? (rawRole[0] as AdminRole) || null
        : (rawRole as AdminRole) || null;
      const roleId = adminRecord.role_id;

      if (!role && roleId) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('admin_roles')
            .select('id, name, slug, description, is_active, created_at, updated_at')
            .eq('id', roleId)
            .maybeSingle();

          if (!roleError && roleData) {
            role = roleData as AdminRole;
          }
        } catch (roleErr) {
          console.warn('Error loading admin role:', roleErr);
        }
      }

      // 5. Load permissions associated with the role from admin_role_permissions
      let permissions: string[] = [];
      if (roleId) {
        try {
          const { data: rolePerms, error: permsError } = await supabase
            .from('admin_role_permissions')
            .select('permission_id, admin_permissions(id, name, description)')
            .eq('role_id', roleId);

          if (!permsError && rolePerms) {
            permissions = rolePerms
              .map((rp: any) => rp.admin_permissions?.name || rp.permission_id)
              .filter(Boolean);
          }
        } catch (permErr) {
          console.warn('Error loading admin permissions:', permErr);
        }
      }

      // 6. Non-blocking telemetry: Update last_login_at and log to activity_logs
      try {
        supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', adminRecord.id)
          .then(() => {});

        supabase
          .from('activity_logs')
          .insert({
            user_id: adminRecord.id,
            action: 'login',
            entity_type: 'auth',
            description: `Admin ${adminRecord.full_name || authUser.email} authenticated.`,
          })
          .then(() => {});
      } catch (telemetryErr) {
        console.warn('Telemetry update notice:', telemetryErr);
      }

      const profile: AdminAuthProfile = {
        authUser,
        adminRecord: adminRecord as unknown as AdminUserRecord,
        role: role || { id: roleId || 'default', name: 'Atelier Administrator' },
        permissions,
      };

      return profile;
    } catch (err: any) {
      console.error('Admin authorization verification error:', err);
      await supabase.auth.signOut();
      setAuthError('Authorization Verification Failure: Could not verify administrator status in public.admin_users.');
      return null;
    }
  }, []);

  const adminProfileRef = useRef<AdminAuthProfile | null>(null);
  const initialBootRef = useRef<boolean>(true);

  // Keep ref in sync
  useEffect(() => {
    adminProfileRef.current = adminProfile;
  }, [adminProfile]);

  // Initial session hydration
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        initialBootRef.current = false;
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval warning:', error.message);
        }

        if (initialSession && initialSession.user) {
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession.user);
          }
          const profile = await verifyAndLoadAdminProfile(initialSession.user);
          if (isMounted) {
            setAdminProfile(profile);
            adminProfileRef.current = profile;
          }
        } else {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setAdminProfile(null);
            adminProfileRef.current = null;
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          initialBootRef.current = false;
        }
      }
    }

    initSession();

    // Listen to Supabase auth state changes (e.g. token refresh on tab focus)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !newSession) {
        setSession(null);
        setUser(null);
        setAdminProfile(null);
        adminProfileRef.current = null;
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        setUser(newSession.user);

        // Prevent tab-switch reload loop:
        // If the session is already active and admin profile exists, DO NOT toggle loading=true!
        // This prevents React from unmounting the router and resetting active form states.
        if (newSession.user) {
          if (adminProfileRef.current && adminProfileRef.current.authUser.id === newSession.user.id) {
            // Silent background refresh without unmounting UI
            verifyAndLoadAdminProfile(newSession.user).then((refreshedProfile) => {
              if (isMounted && refreshedProfile) {
                setAdminProfile(refreshedProfile);
                adminProfileRef.current = refreshedProfile;
              }
            });
          } else if (!initialBootRef.current) {
            // New user login after boot
            const profile = await verifyAndLoadAdminProfile(newSession.user);
            if (isMounted) {
              setAdminProfile(profile);
              adminProfileRef.current = profile;
            }
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verifyAndLoadAdminProfile]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      const msg = 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      setLoading(true);

      // 1. Supabase Auth authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user) {
        const message = signInError?.message || 'Invalid email or password. Please verify your administrator credentials.';
        setAuthError(message);
        setLoading(false);
        return { success: false, error: message };
      }

      // 2. Admin authorization check
      const profile = await verifyAndLoadAdminProfile(data.user);

      if (!profile) {
        // verifyAndLoadAdminProfile handles signOut and setAuthError
        setLoading(false);
        return {
          success: false,
          error: 'Access Denied: This account is not authorized as an active ELIF Administrator.',
        };
      }

      setUser(data.user);
      setSession(data.session);
      setAdminProfile(profile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred during administrative authentication.';
      setAuthError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setAdminProfile(null);
      setAuthError(null);
      setLoading(false);
    }
  };

  const refreshAdminProfile = async (): Promise<void> => {
    if (!user) return;
    const profile = await verifyAndLoadAdminProfile(user);
    setAdminProfile(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        loading,
        authError,
        clearAuthError,
        signIn,
        signOut,
        refreshAdminProfile,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
