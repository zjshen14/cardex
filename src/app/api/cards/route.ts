import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Condition } from '@prisma/client'
import { serializeImageUrls } from '@/lib/imageUtils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
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

    // Use hybrid approach for imageUrls (SQLite JSON string vs PostgreSQL array)
    const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrlsData = serializeImageUrls(imageUrlsArray) as any

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')
    const category = searchParams.get('category')

    const whereClause: Record<string, unknown> = {
      status: 'ACTIVE' // Only show active cards in browsing, exclude SOLD and DELETED
    }

    // Add category filter if specified
    if (category && category !== 'All Categories') {
      whereClause.category = category
    }

    let orderByClause: Record<string, unknown> | Record<string, unknown>[] = {
      createdAt: 'desc'
    }

    // Featured cards: most expensive in last 7 days
    if (featured === 'true') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      whereClause.createdAt = {
        gte: sevenDaysAgo
      }
      
      orderByClause = [
        { price: 'desc' },
        { createdAt: 'desc' }
      ]
    }

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: orderByClause,
      take: limit ? parseInt(limit) : undefined
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