// Hybrid storage abstraction layer - local filesystem for dev, Supabase for production
import fs from 'fs/promises'
import path from 'path'

// Types for storage operations
export interface StorageResult {
  urls: string[]
  error?: string
}

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL

// Storage abstraction layer
export class Storage {
  private static async useLocalStorage(): Promise<boolean> {
    return !isProduction
  }

  static async uploadImages(files: File[]): Promise<string[]> {
    if (await this.useLocalStorage()) {
      return this.uploadToLocal(files)
    } else {
      const { uploadMultipleImages } = await import('./supabaseStorage')
      return uploadMultipleImages(files)
    }
  }

  static async deleteImages(imageUrls: string[]): Promise<void> {
    if (await this.useLocalStorage()) {
      return this.deleteFromLocal(imageUrls)
    } else {
      const { deleteMultipleImages } = await import('./supabaseStorage')
      return deleteMultipleImages(imageUrls)
    }
  }

  // Local filesystem operations (for development)
  private static async uploadToLocal(files: File[]): Promise<string[]> {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cards')
    
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    const urls: string[] = []

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}-${randomString}.${fileExtension}`
      const filePath = path.join(uploadsDir, fileName)

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Write file to disk
      await fs.writeFile(filePath, buffer)

      // Add public URL to results
      urls.push(`/uploads/cards/${fileName}`)
    }

    return urls
  }

  private static async deleteFromLocal(imageUrls: string[]): Promise<void> {
    for (const url of imageUrls) {
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
}

