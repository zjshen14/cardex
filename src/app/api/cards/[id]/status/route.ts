import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null as Session | null
    
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
    const { status } = body

    // Validate status
    const validStatuses = ['ACTIVE', 'SOLD', 'ARCHIVED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ACTIVE, SOLD, ARCHIVED' },
        { status: 400 }
      )
    }

    // Check if the card exists and belongs to the user
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        sellerId: user.id,
        status: { not: 'DELETED' }
      }
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    // Update the card status
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status },
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

    return NextResponse.json(updatedCard)

  } catch (error) {
    console.error('Error updating card status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}