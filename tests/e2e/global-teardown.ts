import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';

/**
 * Global teardown for E2E tests
 * Cleans up test data from Supabase database after all tests complete
 *
 * IMPORTANT SECURITY:
 * - Uses ONLY the public/anon key (SUPABASE_PUBLIC_KEY), never service role key
 * - Requires explicit E2E_USER_ID to prevent accidental data deletion
 * - Only deletes data for the specified test user ID
 * - Dedicated key variable for E2E tests ensures proper isolation
 *
 * This runs once after all test files have finished executing.
 * It removes all flashcards and generations created during test runs
 * to keep the test database clean.
 */
async function globalTeardown() {
  console.log('\n🧹 Starting E2E database cleanup...');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublicKey = process.env.SUPABASE_PUBLIC_KEY; // E2E tests use dedicated public key
  const e2eUserId = process.env.E2E_USER_ID;

  // Validation: All required variables must be set
  if (!supabaseUrl || !supabasePublicKey) {
    console.warn('⚠️  Skipping database cleanup: SUPABASE_URL or SUPABASE_PUBLIC_KEY not set');
    return;
  }

  if (!e2eUserId) {
    console.warn('⚠️  Skipping database cleanup: E2E_USER_ID not set');
    console.warn('⚠️  Set E2E_USER_ID in .env.test to enable automatic cleanup');
    return;
  }

  // Safety check: Verify it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(e2eUserId)) {
    console.error('❌ Invalid E2E_USER_ID format. Must be a valid UUID.');
    console.error('   Example: 4d803b8f-2add-4610-9af3-2103e9b6714b');
    return;
  }

  try {
    // Create Supabase client with PUBLIC KEY ONLY (never use service role key!)
    const supabase = createClient<Database>(supabaseUrl, supabasePublicKey);

    console.log(`🔍 Cleaning data for E2E test user: ${e2eUserId}`);

    // Delete flashcards for E2E test user ONLY
    const { error: flashcardsError, count: flashcardsCount } = await supabase
      .from('flashcards')
      .delete({ count: 'exact' })
      .eq('user_id', e2eUserId); // Only delete for specific E2E user!

    if (flashcardsError) {
      console.error('❌ Error deleting flashcards:', flashcardsError.message);
    } else {
      console.log(`✅ Deleted ${flashcardsCount ?? 0} flashcards`);
    }

    // Delete generation_error_logs for test user's generations (must be done before deleting generations)
    const { data: generationsData } = await supabase.from('generations').select('id').eq('user_id', e2eUserId); // Only for E2E user!

    if (generationsData && generationsData.length > 0) {
      const generationIds = generationsData.map((g) => g.id);

      const { error: errorLogsError, count: errorLogsCount } = await supabase
        .from('generation_error_logs')
        .delete({ count: 'exact' })
        .in('generation_id', generationIds);

      if (errorLogsError) {
        console.error('❌ Error deleting generation error logs:', errorLogsError.message);
      } else {
        console.log(`✅ Deleted ${errorLogsCount ?? 0} generation error logs`);
      }
    }

    // Delete generations for E2E test user ONLY
    const { error: generationsError, count: generationsCount } = await supabase
      .from('generations')
      .delete({ count: 'exact' })
      .eq('user_id', e2eUserId); // Only delete for specific E2E user!

    if (generationsError) {
      console.error('❌ Error deleting generations:', generationsError.message);
    } else {
      console.log(`✅ Deleted ${generationsCount ?? 0} generations`);
    }

    console.log('✨ E2E database cleanup completed successfully\n');
    console.log('   🔒 Only data for E2E user was deleted');
    console.log(`   👤 User ID: ${e2eUserId}\n`);
  } catch (error) {
    console.error('❌ Unexpected error during database cleanup:', error);
  }
}

export default globalTeardown;
