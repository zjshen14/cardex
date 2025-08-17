import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cleanupImages } from '@/lib/imageCleanup'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        isActive: true
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(card)

  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to ensure we have the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { id: cardId } = await params

    // Check if the card exists and belongs to the user
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        sellerId: user.id,
        isActive: true
      }
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Clean up associated images before soft delete
    if (card.imageUrls) {
      await cleanupImages(card.imageUrls)
    }

    // Soft delete - set isActive to false instead of actually deleting
    await prisma.card.update({
      where: { id: cardId },
      data: { isActive: false }
    })

    return NextResponse.json(
      { message: 'Card deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to ensure we have the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { id: cardId } = await params
    const body = await req.json()

    // Validate required fields
    if (!body.title || !body.condition || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, condition, and category are required' },
        { status: 400 }
      )
    }

    // Validate price
    if (body.price !== undefined && body.price !== '') {
      const price = parseFloat(body.price)
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'Price must be a valid positive number' },
          { status: 400 }
        )
      }
    }

    // Validate year
    if (body.year !== undefined && body.year !== '') {
      const year = parseInt(body.year)
      const currentYear = new Date().getFullYear()
      if (isNaN(year) || year < 1900 || year > currentYear) {
        return NextResponse.json(
          { error: `Year must be between 1900 and ${currentYear}` },
          { status: 400 }
        )
      }
    }

    // Check if the card exists and belongs to the user
    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        sellerId: user.id,
        isActive: true
      }
    })

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Card not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Handle imageUrls - convert array to JSON string for SQLite
    let imageUrlsData = existingCard.imageUrls // Keep existing if not provided
    if (body.imageUrls !== undefined) {
      const newImageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : []
      imageUrlsData = JSON.stringify(newImageUrls)
      
      // Clean up removed images
      if (existingCard.imageUrls) {
        try {
          const oldImageUrls = JSON.parse(existingCard.imageUrls)
          const removedImages = oldImageUrls.filter((url: string) => !newImageUrls.includes(url))
          if (removedImages.length > 0) {
            await cleanupImages(removedImages)
          }
        } catch (error) {
          console.warn('Failed to parse existing imageUrls for cleanup:', error)
        }
      }
    }

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        title: body.title,
        description: body.description || null,
        condition: body.condition,
        category: body.category,
        set: body.set || null,
        rarity: body.rarity || null,
        cardNumber: body.cardNumber || null,
        price: body.price ? parseFloat(body.price) : existingCard.price,
        year: body.year ? parseInt(body.year) : null,
        imageUrls: imageUrlsData,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    })

    return NextResponse.json(updatedCard, { status: 200 })

  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}