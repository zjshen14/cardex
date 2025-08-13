import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const cardId = params.id

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
  { params }: { params: { id: string } }
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

    const cardId = params.id
    const body = await req.json()

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

    // Update the card (validation logic similar to POST can be added here)
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...body,
        price: body.price ? parseFloat(body.price) : existingCard.price,
        year: body.year ? parseInt(body.year) : existingCard.year,
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