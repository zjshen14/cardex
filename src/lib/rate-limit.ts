import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked?: boolean
  blockUntil?: number
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      // Remove entries that have expired and are not blocked
      if (now > entry.resetTime && (!entry.blocked || now > (entry.blockUntil || 0))) {
        this.store.delete(key)
      }
    }
  }

  private getClientKey(req: NextRequest, identifier?: string): string {
    // Use provided identifier (like user ID) or fall back to IP
    if (identifier) {
      return `user:${identifier}`
    }
    
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    return `ip:${ip.split(',')[0]}`
  }

  check(
    req: NextRequest, 
    options: {
      windowMs: number // Time window in milliseconds
      maxAttempts: number // Max attempts in window
      blockDurationMs?: number // How long to block after exceeding limit
      identifier?: string // Optional identifier (like user ID)
    }
  ): { allowed: boolean; remainingAttempts: number; resetTime: number; blocked?: boolean } {
    const { windowMs, maxAttempts, blockDurationMs = windowMs * 2, identifier } = options
    const key = this.getClientKey(req, identifier)
    const now = Date.now()
    
    let entry = this.store.get(key)
    
    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockUntil,
        blocked: true
      }
    }

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false
      }
      this.store.set(key, entry)
    }

    // Increment attempt count
    entry.count++

    // Check if limit exceeded
    if (entry.count > maxAttempts) {
      entry.blocked = true
      entry.blockUntil = now + blockDurationMs
      this.store.set(key, entry)
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockUntil,
        blocked: true
      }
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - entry.count,
      resetTime: entry.resetTime
    }
  }

  reset(req: NextRequest, identifier?: string) {
    const key = this.getClientKey(req, identifier)
    this.store.delete(key)
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Login attempts: 5 attempts per 15 minutes, block for 30 minutes
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  
  // Password change: 3 attempts per hour, block for 2 hours
  PASSWORD_CHANGE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
  },
  
  // Registration: 3 attempts per hour per IP
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
  },
  
  // General API: 100 requests per 15 minutes
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  }
}