/// <reference types="astro/client" />
/// <reference types="astro/env" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<{
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENROUTER_API_KEY: string;
}>;

declare global {
  namespace App {
    interface Locals extends CloudflareRuntime {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
