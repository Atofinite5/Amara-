import { SupabasePlugin } from '../src/plugins/supabasePlugin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const resolveDns = promisify(dns.resolve);

// --- Helpers ---

/**
 * Validates the environment configuration.
 * Exits if required variables are missing or invalid.
 */
function validateConfig() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ Configuration Error: Missing environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\nPlease create a .env file based on .env.example:');
    console.log('   cp .env.example .env');
    console.log('   # Then edit .env with your actual credentials');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL!;
  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith('.supabase.co')) {
      console.warn(`⚠️  Warning: SUPABASE_URL '${url}' does not look like a standard Supabase URL (ending in .supabase.co).`);
    }
  } catch (e) {
    console.error(`❌ Configuration Error: Invalid SUPABASE_URL: '${url}'`);
    process.exit(1);
  }
}

/**
 * Performs a DNS lookup to verify the Supabase host is reachable.
 */
async function checkNetwork(url: string): Promise<boolean> {
  try {
    const hostname = new URL(url).hostname;
    console.log(`🔍 Diagnostics: Resolving DNS for ${hostname}...`);
    const addresses = await resolveDns(hostname);
    console.log(`   Resolved to: ${addresses.join(', ')}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Network Error: Could not resolve hostname '${url}'.`);
    console.error(`   Details: ${error.code} - ${error.message}`);
    console.log('\nTroubleshooting Checklist:');
    console.log('   1. Check your internet connection.');
    console.log('   2. Verify the SUPABASE_URL in your .env file.');
    console.log('   3. Ensure no firewall is blocking DNS/HTTPS.');
    return false;
  }
}

/**
 * Retries an async operation with exponential backoff.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Check if it's a network-like error that is worth retrying
    const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.message.includes('fetch');
    
    if (isNetworkError) {
      console.log(`⚠️  Transient error detected. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    
    throw error;
  }
}

// --- Main Demo ---

async function runDemo() {
  console.log('--- Supabase Plugin Demo (Enhanced) ---');

  // 1. Environment Setup & Validation
  if (!fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    console.warn('⚠️  Warning: .env file not found in current directory.');
  }
  validateConfig();

  const config = {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  };

  // 2. Network Diagnostics
  const isNetworkHealthy = await checkNetwork(config.url);
  if (!isNetworkHealthy) {
    console.error('❌ Network check failed. Aborting demo.');
    process.exit(1);
  }

  // 3. Initialization
  const supabase = new SupabasePlugin(config);

  try {
    // 4. Connection Test with Retry
    console.log('\n--- Connection Test ---');
    const isConnected = await withRetry(async () => {
      const result = await supabase.testConnection();
      if (!result) throw new Error('Connection test returned false');
      return result;
    });
    console.log('✅ Connected to Supabase');

    // 5. Authentication (Example)
    console.log('\n--- Authentication ---');
    const email = 'demo@example.com';
    const password = 'securepassword123';
    
    // We wrap SupabasePlugin methods which return { data, error } 
    // If we wanted to retry them, we'd need to check .error or throw inside the wrapper.
    // For this demo, let's treat auth failures as non-retriable usually, unless network related.
    // But since our plugin catches errors and returns { error }, we'd need to inspect it.
    
    const authResult = await supabase.signIn(email, password);
    if (authResult.error) {
      console.log(`ℹ️  Sign in result: ${authResult.error.message} (Expected if user doesn't exist)`);
    } else {
      console.log(`✅ Signed in as: ${authResult.data.user.email}`);
    }

    // 6. Database Operations with Error Handling
    console.log('\n--- Database Operations ---');
    
    const newEvent = {
      rule_id: 'demo-rule-1',
      file_path: '/src/demo.ts',
      details: 'Demo event triggered',
      timestamp: new Date().toISOString()
    };

    // Retry insert
    const insertResult = await withRetry(async () => {
      const res = await supabase.insertData('events', newEvent);
      // If we want to retry on database errors (like timeouts), we could throw here
      // But usually application logic errors shouldn't be retried blindly.
      // We'll trust the plugin's error return for now.
      return res;
    });

    if (insertResult.error) {
      console.log(`❌ Insert failed: ${insertResult.error.message}`);
    } else {
      console.log('✅ Record inserted:', insertResult.data);
    }

    // Fetch
    const fetchResult = await supabase.getData('events', '*', 5);
    if (fetchResult.error) {
      console.log(`❌ Fetch failed: ${fetchResult.error.message}`);
    } else {
      console.log(`✅ Fetched ${fetchResult.data?.length} records`);
    }

    // 7. Real-time Subscriptions
    console.log('\n--- Real-time Subscription ---');
    supabase.subscribeToTable('events', (payload) => {
      console.log('⚡ Real-time update received:', payload.new);
    });
    
    console.log('Listening for changes on "events" table for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error: any) {
    console.error('\n❌ Critical Error during execution:');
    console.error(`   ${error.message}`);
    if (error.cause) console.error(`   Cause: ${error.cause}`);
  } finally {
    // 8. Cleanup
    supabase.disconnect();
    console.log('\n--- Demo Complete ---');
  }
}

runDemo().catch(console.error);
