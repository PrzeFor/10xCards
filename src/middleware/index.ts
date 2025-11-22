import { defineMiddleware } from 'astro:middleware';

import { createSupabaseServerInstance } from '../db/supabase.client.ts';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  // Auth API endpoints
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  // Static assets
  '/favicon.png',
];

/**
 * Check if the path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  // Exact match for public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  
  // Check for dynamic routes like /auth/reset-password/[token]
  if (pathname.startsWith('/auth/reset-password/')) {
    return true;
  }
  
  // Check for static assets
  if (pathname.startsWith('/_astro/') || pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/)) {
    return true;
  }
  
  return false;
}

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Set user in locals if authenticated
    if (user) {
      locals.user = {
        email: user.email!,
        id: user.id,
      };
    }

    // Store supabase instance in locals
    locals.supabase = supabase;

    // Check if path requires authentication
    if (!isPublicPath(url.pathname) && !user) {
      // Redirect to login for protected routes
      return redirect('/auth/login');
    }

    return next();
  },
);

