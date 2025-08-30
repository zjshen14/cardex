import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { Session } from 'next-auth'
import fs from 'fs/promises'
import path from 'path'
import { rateLimiter } from '@/lib/rate-limit'
import { isProduction } from '@/lib/environment'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for upload endpoints (10 uploads per minute per user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any)?.id
    const rateLimit = rateLimiter.check(request, {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 10, // 10 uploads per minute
      blockDurationMs: 5 * 60 * 1000, // 5 minute block
      identifier: userId // Use user ID for authenticated rate limiting
    })
    
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toISOString()
      return NextResponse.json(
        { 
          error: rateLimit.blocked 
            ? `Upload rate limit exceeded. Try again after ${resetTime}` 
            : 'Too many upload requests. Please slow down.',
          remainingAttempts: rateLimit.remainingAttempts,
          resetTime
        },
        { status: 429 }
      )
    }

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
    if (isProduction()) {
      // Use Supabase storage for production
      const { uploadMultipleImages } = await import('@/lib/supabaseStorage')
      const urls = await uploadMultipleImages(files)
      // Reset rate limit on successful upload
      rateLimiter.reset(request, userId)
      
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

      // Reset rate limit on successful upload
      rateLimiter.reset(request, userId)
      
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