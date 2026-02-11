import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration constants
const SUPABASE_URL = 'https://qemvotgyufhqnyhkdrwu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vLQTL05HjBY7pG3QohaFA__86IYJqF';

// 1) Proper initialization of the Supabase client
let supabase: SupabaseClient;

try {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL and Key must be defined.');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false, // Optimized for server-side usage
      autoRefreshToken: true,
    },
  });

  // Console logging of initialization
  console.log('✅ Supabase client initialized successfully.');
  console.log(`   URL: ${SUPABASE_URL}`);
} catch (error: any) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  // Re-throw or handle as critical failure depending on app needs
  throw error;
}

// Export the configured client
export { supabase };

// 2) Async function to test the database connection
export async function testDatabaseConnection(): Promise<boolean> {
  console.log('\n🔄 Testing database connection...');

  try {
    // Query the "test" table
    const { data, error } = await supabase.from('test').select('*').limit(1);

    // 3) Error handling for query execution
    if (error) {
      throw error;
    }

    // 4) Console logging of successful data retrieval
    console.log('✅ Database connection successful!');
    console.log('   Data retrieved:', data);
    return true;
  } catch (error: any) {
    // 4) Console logging of errors encountered
    console.error('❌ Database connection failed.');
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
}
