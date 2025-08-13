import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    const cards = await prisma.card.findMany({
      where: {
        sellerId: user.id,
        isActive: true
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        transactions: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
            buyer: {
              select: {
                name: true,
                username: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(cards)

  } catch (error) {
    console.error('Error fetching user cards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}