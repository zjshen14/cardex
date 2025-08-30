/**
 * Centralized environment detection utilities
 * 
 * Provides consistent environment detection logic across the application
 * to determine whether we're running in production (with Supabase) or 
 * development (with local filesystem).
 */

/**
 * Determines if the application is running in production environment
 * Production is defined as NODE_ENV=production AND having Supabase configuration
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && 
         Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
}

/**
 * Determines if the application is running in development environment
 * Development is any environment that is not production
 */
export function isDevelopment(): boolean {
  return !isProduction()
}

/**
 * Returns the appropriate storage backend based on environment
 * - Production: 'supabase' (cloud storage)
 * - Development: 'local' (filesystem)
 */
export function getStorageBackend(): 'local' | 'supabase' {
  return isProduction() ? 'supabase' : 'local'
}

/**
 * Returns the appropriate database configuration based on environment
 * - Production: PostgreSQL via Supabase
 * - Development: SQLite local file
 */
export function getDatabaseType(): 'sqlite' | 'postgresql' {
  return isProduction() ? 'postgresql' : 'sqlite'
}

/**
 * Returns environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = isProduction() ? 'production' : 'development'
  
  return {
    env,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    storage: getStorageBackend(),
    database: getDatabaseType(),
    // Supabase configuration (only available in production)
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasConfig: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  }
}

/**
 * Type guard to check if Supabase configuration is available
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}