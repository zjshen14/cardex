import fs from 'fs/promises'
import path from 'path'
import { parseImageUrls } from './imageUtils'
import { isProduction } from './environment'

/**
 * Cleans up image files using hybrid storage (local filesystem or Supabase)
 * @param imageUrls Array of image URLs or JSON string (depending on database)
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupImages(imageUrls: string | string[]): Promise<void> {
  try {
    // Parse imageUrls to handle both SQLite JSON strings and PostgreSQL arrays
    const urlArray = parseImageUrls(imageUrls)
    
    if (urlArray.length === 0) {
      return
    }

    // Check if we should use Supabase storage (production)
    if (isProduction()) {
      // Use Supabase storage deletion for production
      const { deleteMultipleImages } = await import('./supabaseStorage')
      await deleteMultipleImages(urlArray)
    } else {
      // Use local filesystem deletion for development
      for (const url of urlArray) {
        try {
          // Only process local URLs
          if (url.startsWith('/uploads/cards/')) {
            const filePath = path.join(process.cwd(), 'public', url)
            await fs.unlink(filePath)
          }
        } catch (error) {
          console.warn(`Failed to delete local file: ${url}`, error)
          // Continue with other files
        }
      }
    }
    
    console.log('Cleaned up images:', urlArray.length, 'files')
  } catch (error) {
    console.error('Error in cleanupImages:', error)
    // Don't throw - image cleanup failure shouldn't prevent deletion
  }
}