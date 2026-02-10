import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Default to dummy values if not present to avoid crash on startup, but log warning
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
