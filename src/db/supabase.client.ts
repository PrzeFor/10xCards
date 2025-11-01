import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the SupabaseClient type for use in other files
export type { SupabaseClient };

// Default user ID for development/testing phase
export const DEFAULT_USER_ID = '4d803b8f-2add-4610-9af3-2103e9b6714b';

