import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration provided by user
const DEFAULT_SUPABASE_URL = 'https://xypyegletikcmwfjcgdq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6FCk7dwoUXIT1SacAKKuWw__JLCMExF';

function sanitizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip REST endpoint suffix if provided (e.g., /rest/v1)
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = (rawKey || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('placeholder')
);

// Effective parameters
const effectiveUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const effectiveKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSupabaseConfigStatus = () => {
  let hostname = '';
  try {
    const parsed = new URL(supabaseUrl);
    hostname = parsed.hostname;
  } catch {
    hostname = supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('/')[0] : '';
  }

  return {
    configured: isSupabaseConfigured,
    url: hostname || null,
    fullUrl: supabaseUrl,
  };
};
