import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Condition } from '@prisma/client'

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const {
      title,
      description,
      condition,
      price,
      category,
      set,
      rarity,
      cardNumber,
      year,
      imageUrls = []
    } = body

    // Validate required fields
    if (!title || !condition || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate condition enum
    if (!Object.values(Condition).includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition value' },
        { status: 400 }
      )
    }

    // Validate price
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      )
    }

    // Validate year if provided
    let yearNum = null
    if (year) {
      yearNum = parseInt(year)
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        return NextResponse.json(
          { error: 'Invalid year value' },
          { status: 400 }
        )
      }
    }

    // For development (SQLite), store imageUrls as JSON string
    // For production (PostgreSQL), it will be stored as array
    const imageUrlsData = Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : '[]'

    const card = await prisma.card.create({
      data: {
        title,
        description,
        condition,
        price: priceNum,
        category,
        set,
        rarity,
        cardNumber,
        year: yearNum,
        imageUrls: imageUrlsData,
        sellerId: user.id,
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

    return NextResponse.json(card, { status: 201 })

  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(cards)

  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}