import { supabase, STORAGE_BUCKET } from './supabase'

export async function uploadImage(file: File): Promise<string> {
  // Generate unique filename with timestamp and random string
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}.${fileExtension}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabase.storage
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
  
  const { error } = await supabase.storage
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