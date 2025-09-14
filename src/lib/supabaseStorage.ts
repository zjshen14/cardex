import { supabaseAdmin, STORAGE_BUCKET } from './supabase-admin'
import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

async function validateFileContent(file: File): Promise<void> {
  // Get file buffer for content analysis
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Detect actual file type from content
  const detectedType = await fileTypeFromBuffer(buffer)
  
  if (!detectedType) {
    throw new Error(`Unable to detect file type for: ${file.name}`)
  }
  
  // Check if detected MIME type is allowed
  if (!ALLOWED_TYPES.includes(detectedType.mime)) {
    throw new Error(`File content does not match allowed types. Detected: ${detectedType.mime}`)
  }
  
  // Additional validation: ensure reported type matches content
  // Note: Some browsers report 'image/jpg' while actual MIME is 'image/jpeg'
  const normalizedReportedType = file.type === 'image/jpg' ? 'image/jpeg' : file.type
  const normalizedDetectedType = detectedType.mime
  
  if (normalizedReportedType !== normalizedDetectedType) {
    console.warn(`MIME type mismatch for ${file.name}: reported ${file.type}, detected ${detectedType.mime}`)
    // Allow the upload if detected type is valid, but log the mismatch for monitoring
  }
}

export async function uploadImage(file: File): Promise<string> {
  // Validate file content before upload
  await validateFileContent(file)
  
  // Generate unique filename with timestamp and random string
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}.${fileExtension}`

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file))
  return Promise.all(uploadPromises)
}

export async function deleteImage(url: string): Promise<void> {
  // Extract the file path from the Supabase URL
  const urlParts = url.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
  if (urlParts.length !== 2) {
    console.warn('Invalid Supabase URL format:', url)
    return
  }

  const filePath = urlParts[1]
  
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Failed to delete image:', error.message)
    // Don't throw error for cleanup operations
  }
}

export async function deleteMultipleImages(urls: string[]): Promise<void> {
  const deletePromises = urls.map(url => deleteImage(url))
  await Promise.all(deletePromises)
}