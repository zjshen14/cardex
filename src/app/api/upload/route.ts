import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'cards')
    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}`)
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${file.name}`)
      }
    }

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadPromises = files.map(async (file: File) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExtension = file.name.split('.').pop()
      const filename = `card_${timestamp}_${randomId}.${fileExtension}`
      
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      
      return `/uploads/cards/${filename}`
    })

    const uploadedUrls = await Promise.all(uploadPromises)

    return NextResponse.json({ 
      success: true, 
      urls: uploadedUrls 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' }, 
      { status: 500 }
    )
  }
}