import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Cleans up image files from the filesystem
 * @param imageUrls Array of image URLs or JSON string containing URLs
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupImages(imageUrls: string | string[]): Promise<void> {
  try {
    // Parse imageUrls if it's a JSON string
    let urls: string[] = []
    if (typeof imageUrls === 'string') {
      try {
        urls = JSON.parse(imageUrls)
      } catch (error) {
        console.warn('Failed to parse imageUrls JSON:', error)
        return
      }
    } else if (Array.isArray(imageUrls)) {
      urls = imageUrls
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      return
    }

    // Clean up each image file
    const cleanupPromises = urls.map(async (url) => {
      try {
        // Extract filename from URL (e.g., "/uploads/cards/filename.jpg" -> "filename.jpg")
        if (!url.startsWith('/uploads/cards/')) {
          console.warn('Skipping non-local image URL:', url)
          return
        }

        const filename = url.replace('/uploads/cards/', '')
        const filepath = join(process.cwd(), 'public', 'uploads', 'cards', filename)

        // Check if file exists before attempting to delete
        if (existsSync(filepath)) {
          await unlink(filepath)
          console.log('Deleted image file:', filepath)
        } else {
          console.warn('Image file not found:', filepath)
        }
      } catch (error) {
        console.error('Error deleting image file:', url, error)
        // Don't throw - continue with other files
      }
    })

    await Promise.allSettled(cleanupPromises)
  } catch (error) {
    console.error('Error in cleanupImages:', error)
    // Don't throw - image cleanup failure shouldn't prevent deletion
  }
}