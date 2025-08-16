import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            cards: true,
            purchases: true,
            sales: true,
            watchlist: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, username } = body

    // Validate input
    if (username && typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username must be a string' },
        { status: 400 }
      )
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name must be a string' },
        { status: 400 }
      )
    }

    // Check if username is already taken (if provided and different from current)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: {
            id: session.user.id
          }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name: name || null,
        username: username || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            cards: true,
            purchases: true,
            sales: true,
            watchlist: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}