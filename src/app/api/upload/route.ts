import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files allowed' }, { status: 400 })
    }

    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}`)
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${file.name}`)
      }
    }

    // Check if we should use Supabase storage (production)
    const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (isProduction) {
      // Use Supabase storage for production
      const { uploadMultipleImages } = await import('@/lib/supabaseStorage')
      const urls = await uploadMultipleImages(files)
      return NextResponse.json({ 
        message: 'Files uploaded successfully',
        urls 
      })
    } else {
      // Use local filesystem for development
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cards')
      
      // Ensure uploads directory exists
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
      } catch {
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

      return NextResponse.json({ 
        message: 'Files uploaded successfully',
        urls 
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' }, 
      { status: 500 }
    )
  }
}