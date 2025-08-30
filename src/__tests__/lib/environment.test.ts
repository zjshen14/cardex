import { 
  isProduction, 
  isDevelopment, 
  getStorageBackend, 
  getDatabaseType,
  getEnvironmentConfig,
  hasSupabaseConfig
} from '@/lib/environment'

describe('Environment Utils', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production and Supabase URL is set', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      
      expect(isProduction()).toBe(true)
    })

    it('should return false when NODE_ENV is production but Supabase URL is missing', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(isProduction()).toBe(false)
    })

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      
      expect(isProduction()).toBe(false)
    })
  })

  describe('isDevelopment', () => {
    it('should return false when in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      
      expect(isDevelopment()).toBe(false)
    })

    it('should return true when not in production', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(isDevelopment()).toBe(true)
    })
  })

  describe('getStorageBackend', () => {
    it('should return "supabase" in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      
      expect(getStorageBackend()).toBe('supabase')
    })

    it('should return "local" in development', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(getStorageBackend()).toBe('local')
    })
  })

  describe('getDatabaseType', () => {
    it('should return "postgresql" in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      
      expect(getDatabaseType()).toBe('postgresql')
    })

    it('should return "sqlite" in development', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(getDatabaseType()).toBe('sqlite')
    })
  })

  describe('getEnvironmentConfig', () => {
    it('should return production config', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      const config = getEnvironmentConfig()
      
      expect(config.env).toBe('production')
      expect(config.isProduction).toBe(true)
      expect(config.isDevelopment).toBe(false)
      expect(config.storage).toBe('supabase')
      expect(config.database).toBe('postgresql')
      expect(config.supabase.hasConfig).toBe(true)
    })

    it('should return development config', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const config = getEnvironmentConfig()
      
      expect(config.env).toBe('development')
      expect(config.isProduction).toBe(false)
      expect(config.isDevelopment).toBe(true)
      expect(config.storage).toBe('local')
      expect(config.database).toBe('sqlite')
      expect(config.supabase.hasConfig).toBe(false)
    })
  })

  describe('hasSupabaseConfig', () => {
    it('should return true when both URL and key are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      expect(hasSupabaseConfig()).toBe(true)
    })

    it('should return false when URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      expect(hasSupabaseConfig()).toBe(false)
    })

    it('should return false when key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      expect(hasSupabaseConfig()).toBe(false)
    })
  })
})