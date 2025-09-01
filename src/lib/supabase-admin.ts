import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

if (!supabaseServiceKey) {
  // In development/testing, we can fall back to anon key with a warning
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Using anon key for development. This is NOT secure for production!')
  } else {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production for secure storage operations.')
  }
}

// Admin client with service role (bypasses RLS for authorized operations)
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fallback to anon key in dev
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Storage bucket name for card images
export const STORAGE_BUCKET = 'card-images'