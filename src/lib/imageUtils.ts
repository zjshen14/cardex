// Client-safe image URL parsing utilities

// Check if we're in production environment (client-safe check)
const isProduction = typeof window !== 'undefined' 
  ? window.location.hostname !== 'localhost'
  : process.env.NODE_ENV === 'production'

// Utility functions to handle imageUrls field differences between SQLite and PostgreSQL
export function parseImageUrls(imageUrls: string | string[]): string[] {
  if (Array.isArray(imageUrls)) {
    return imageUrls // PostgreSQL native array
  }
  try {
    return JSON.parse(imageUrls) // SQLite JSON string
  } catch {
    return []
  }
}

export function serializeImageUrls(imageUrls: string[]): string | string[] {
  if (isProduction) {
    return imageUrls // PostgreSQL native array
  }
  return JSON.stringify(imageUrls) // SQLite JSON string
}