import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, Lock, Key, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, adminProfile, signIn, loading, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Read any redirect reason passed from protected route
  const redirectReason = (location.state as any)?.deniedReason;

  // If already authenticated and active admin, route to dashboard
  useEffect(() => {
    if (user && adminProfile) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, adminProfile, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    if (!email.trim()) {
      setFormError('Please enter your administrator email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your account password.');
      return;
    }

    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  const configStatus = getSupabaseConfigStatus();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col justify-between selection:bg-[#0A1C14] selection:text-[#FAF8F5]">
      {/* Top Header bar */}
      <header className="border-b border-[#E7E1D7] bg-[#FAF8F5]/90 backdrop-blur-sm px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-brand text-lg tracking-[0.3em] text-[#0A1C14] font-medium">
            ELIF
          </span>
          <span className="text-[#C4BCAD] text-xs font-light">/</span>
          <span className="font-fashion text-[10px] tracking-[0.25em] uppercase text-[#736B5E]">
            Maison de Couture
          </span>
        </div>
        <div className="font-fashion text-[9px] tracking-[0.25em] uppercase text-[#544D42] border border-[#DDD5C7] bg-[#F4EFE6] px-3 py-1 font-medium">
          Accès Réservé
        </div>
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] bg-[#FFFFFF] border border-[#E3DCD1] p-8 sm:p-12 shadow-[0_4px_24px_-8px_rgba(10,28,20,0.06)] relative">
          {/* Subtle Top Luxury Forest Green Bar with Gold Center Pip */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0A1C14]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#C5A880]" />

          {/* Header Brand */}
          <div className="text-center mb-9">
            <span className="font-fashion text-[9px] tracking-[0.4em] uppercase text-[#8A8172] block mb-2 font-medium">
              Private Operations Console
            </span>
            <h1 className="font-brand text-3xl sm:text-4xl tracking-[0.3em] text-[#0A1C14] font-normal mb-2">
              ELIF
            </h1>
            <p className="font-serif italic text-sm text-[#615A4D] font-light">
              Haute Couture Atelier & Digital Archive
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="h-[1px] w-8 bg-[#E3DCD1]" />
              <span className="text-[#C5A880] text-[9px]">✦</span>
              <span className="h-[1px] w-8 bg-[#E3DCD1]" />
            </div>
          </div>

          {/* Supabase Configuration Status Indicator */}
          {configStatus.configured ? (
            <div
              id="supabase-connected-badge"
              className="mb-6 px-3.5 py-2.5 bg-[#F9F7F2] border border-[#DDD5C7] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="font-fashion text-[9.5px] uppercase tracking-[0.2em] text-[#474136] font-semibold">
                  Supabase Connecté
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A8172]">
                Projet Partagé
              </span>
            </div>
          ) : (
            <div
              id="supabase-config-banner"
              className="mb-7 p-4 bg-[#F7F4EE] border border-[#D9CEBF] text-left space-y-2.5"
            >
              <div className="flex items-center gap-2 text-[#0A1C14] font-medium">
                <Info className="w-4 h-4 text-[#8C7355] shrink-0" />
                <span className="font-fashion uppercase tracking-[0.2em] text-[10px] font-semibold text-[#0A1C14]">
                  Supabase Project Link Required
                </span>
              </div>
              <p className="font-sans text-[#524B3F] text-xs leading-relaxed font-normal">
                To link this admin instance to your existing ELIF Supabase backend, supply the following keys in your environment:
              </p>
              <div className="bg-white p-3 border border-[#E3DCD1] font-mono text-[10.5px] text-[#1F2923] space-y-1 select-all">
                <div className="text-[#0A1C14] font-medium">VITE_SUPABASE_URL=https://[project-id].supabase.co</div>
                <div className="text-[#0A1C14] font-medium">VITE_SUPABASE_ANON_KEY=[anon-public-key]</div>
              </div>
              <p className="font-sans text-[11px] text-[#70685B] leading-relaxed">
                Admins must be registered with an active role in <code className="font-mono text-[#0A1C14] bg-white px-1 py-0.5 border border-[#E3DCD1]">public.admin_users</code>.
              </p>
            </div>
          )}

          {/* Error Message Display */}
          {(formError || authError || redirectReason) && (
            <div
              id="admin-login-error"
              className="mb-6 p-4 bg-[#FDF2F2] border border-[#F8B4B4] text-[#991B1B] text-xs flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-fashion font-semibold text-[10.5px] tracking-[0.2em] uppercase text-[#7F1D1D]">
                  Access Notice
                </p>
                <p className="font-sans text-xs mt-1 text-[#991B1B]">
                  {formError || authError || redirectReason}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="admin-email"
                  className="font-fashion text-[10px] tracking-[0.25em] uppercase text-[#474136] font-semibold block"
                >
                  Administrator Identity
                </label>
                <span className="font-fashion text-[9px] tracking-wider text-[#9E9587] uppercase">
                  Staff Email
                </span>
              </div>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atelier@elif-couture.com"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD5C7] text-sm font-sans text-[#1A1A1A] placeholder:text-[#AAA090] focus:outline-none focus:border-[#0A1C14] focus:bg-white focus:ring-1 focus:ring-[#0A1C14]/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="admin-password"
                  className="font-fashion text-[10px] tracking-[0.25em] uppercase text-[#474136] font-semibold block"
                >
                  Credential Key
                </label>
                <span className="font-fashion text-[9px] tracking-wider text-[#9E9587] uppercase">
                  Encrypted
                </span>
              </div>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD5C7] text-sm font-sans text-[#1A1A1A] placeholder:text-[#AAA090] focus:outline-none focus:border-[#0A1C14] focus:bg-white focus:ring-1 focus:ring-[#0A1C14]/10 transition-all"
              />
            </div>

            <button
              id="btn-admin-signin"
              type="submit"
              disabled={submitting || loading}
              className="w-full mt-3 py-3.5 px-5 bg-[#0A1C14] hover:bg-[#122E21] text-[#FAF8F5] font-fashion text-[11px] uppercase tracking-[0.3em] font-medium transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
            >
              {submitting || loading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-[#FAF8F5] border-t-transparent rounded-full animate-spin" />
                  <span className="font-fashion tracking-[0.25em]">Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span className="font-fashion tracking-[0.25em]">Enter Administrative Archive</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                </>
              )}
            </button>
          </form>

          {/* Security & Access policy note */}
          <div className="mt-9 pt-7 border-t border-[#EAE3D8] text-center space-y-2">
            <div className="flex items-center justify-center gap-2 font-fashion text-[10px] uppercase tracking-[0.25em] text-[#5C5548] font-medium">
              <Lock className="w-3 h-3 text-[#0A1C14]" />
              <span>Privileged Environment</span>
            </div>
            <p className="font-sans text-[11px] text-[#7A7162] leading-relaxed font-light">
              Public self-registration is permanently disabled. Customer credentials will be denied administrative routing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E1D7] py-4 px-6 text-center font-fashion text-[9.5px] uppercase tracking-[0.3em] text-[#827A6D]">
        ELIF Maison de Couture • Proprietary Administration System • Confidential
      </footer>
    </div>
  );
};
