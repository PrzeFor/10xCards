import type { AstroCookies } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

/**
 * Get environment variables from import.meta.env or runtime
 * This supports both build-time and Cloudflare runtime environment variables
 */
function getEnvVars(runtime?: { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } }) {
  return {
    supabaseUrl: runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL,
    supabaseAnonKey: runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY,
  };
}

// Client-side Supabase client (for backwards compatibility)
// This will use build-time environment variables
let _clientInstance: SupabaseClient<Database> | null = null;
export const supabaseClient = (() => {
  if (!_clientInstance) {
    const { supabaseUrl, supabaseAnonKey } = getEnvVars();
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined');
    }
    _clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _clientInstance;
})();

// Export the SupabaseClient type for use in other files
export type { SupabaseClient };

// Default user ID for development/testing phase
export const DEFAULT_USER_ID = '4d803b8f-2add-4610-9af3-2103e9b6714b';

// Cookie options for SSR authentication
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

/**
 * Parse cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Create Supabase server instance for SSR with proper cookie handling
 * Use this in Astro pages and API endpoints instead of the client-side supabaseClient
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtime?: { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } };
}) => {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars(context.runtime);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined');
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
