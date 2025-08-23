import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

// GET /api/watchlist - Get user's watchlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to ensure we have the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        card: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(watchlist)

  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/watchlist - Add card to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await request.json()
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Check if already in watchlist
    const existingEntry = await prisma.watchlist.findUnique({
      where: {
        userId_cardId: {
          userId: user.id,
          cardId: cardId
        }
      }
    })

    if (existingEntry) {
      return NextResponse.json({ error: 'Card already in watchlist' }, { status: 409 })
    }

    // Add to watchlist
    const watchlistEntry = await prisma.watchlist.create({
      data: {
        userId: user.id,
        cardId: cardId
      },
      include: {
        card: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(watchlistEntry, { status: 201 })

  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/watchlist - Remove card from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await request.json()
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find and delete watchlist entry
    const watchlistEntry = await prisma.watchlist.findUnique({
      where: {
        userId_cardId: {
          userId: user.id,
          cardId: cardId
        }
      }
    })

    if (!watchlistEntry) {
      return NextResponse.json({ error: 'Card not in watchlist' }, { status: 404 })
    }

    await prisma.watchlist.delete({
      where: {
        userId_cardId: {
          userId: user.id,
          cardId: cardId
        }
      }
    })

    return NextResponse.json({ message: 'Card removed from watchlist' })

  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}