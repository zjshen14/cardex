import { NextRequest } from 'next/server'

// Mock NextRequest for testing
const mockNextRequest = (url: string, init?: RequestInit) => {
  return {
    url,
    method: init?.method || 'GET',
    headers: new Headers(init?.headers),
    json: async () => JSON.parse(init?.body as string || '{}'),
    text: async () => init?.body as string || '',
  } as NextRequest
}
import { POST, GET } from '@/app/api/cards/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
  })),
}))

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({
    name: 'prisma-adapter',
  })),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    adapter: {},
    session: { strategy: 'jwt' },
    callbacks: {},
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    card: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockedPrisma = prisma as any

describe('/api/cards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/cards', () => {
    const validCardData = {
      title: 'Charizard',
      description: 'Rare Pokemon card',
      condition: 'MINT',
      price: '100.00',
      category: 'Trading Cards',
      set: 'Base Set',
      rarity: 'Rare',
      cardNumber: '4/102',
      year: '1999',
      imageUrls: [],
    }

    it('should create a card when authenticated with valid data', async () => {
      // Mock session
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })

      // Mock user lookup
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })

      // Mock card creation
      const createdCard = {
        id: 'card-123',
        ...validCardData,
        price: 100.00,
        year: 1999,
        sellerId: 'user-123',
        seller: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser'
        }
      }
      mockedPrisma.card.create.mockResolvedValue(createdCard)

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(validCardData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('card-123')
      expect(data.title).toBe('Charizard')
      expect(mockedPrisma.card.create).toHaveBeenCalledWith({
        data: {
          title: 'Charizard',
          description: 'Rare Pokemon card',
          condition: 'MINT',
          price: 100.00,
          category: 'Trading Cards',
          set: 'Base Set',
          rarity: 'Rare',
          cardNumber: '4/102',
          year: 1999,
          imageUrls: '[]',
          sellerId: 'user-123',
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
    })

    it('should return 401 when not authenticated', async () => {
      mockedGetServerSession.mockResolvedValue(null)

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue(null)

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should return 400 when required fields are missing', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' })

      const invalidData = { ...validCardData }
      delete invalidData.title

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 400 when condition is invalid', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' })

      const invalidData = { ...validCardData, condition: 'INVALID_CONDITION' }

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid condition value')
    })

    it('should return 400 when price is invalid', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' })

      const invalidData = { ...validCardData, price: 'invalid' }

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid price value')
    })

    it('should return 400 when year is invalid', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' })

      const invalidData = { ...validCardData, year: '1800' }

      const request = mockNextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid year value')
    })
  })

  describe('GET /api/cards', () => {
    it('should return all active cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          title: 'Charizard',
          condition: 'MINT',
          price: 100.00,
          status: 'ACTIVE',
          seller: {
            id: 'user-1',
            name: 'Test User',
            username: 'testuser'
          }
        },
        {
          id: 'card-2',
          title: 'Blastoise',
          condition: 'NEAR_MINT',
          price: 75.00,
          status: 'ACTIVE',
          seller: {
            id: 'user-2',
            name: 'Another User',
            username: 'anotheruser'
          }
        }
      ]

      mockedPrisma.card.findMany.mockResolvedValue(mockCards)

      const response = await GET(mockNextRequest('http://localhost:3000/api/cards'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].title).toBe('Charizard')
      expect(data[1].title).toBe('Blastoise')
      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE'
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
    })

    it('should handle database errors gracefully', async () => {
      mockedPrisma.card.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(mockNextRequest('http://localhost:3000/api/cards'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return featured cards with correct parameters', async () => {
      const mockCards = [
        {
          id: 'card-1',
          title: 'Expensive Card',
          condition: 'MINT',
          price: 500.00,
          status: 'ACTIVE',
          createdAt: new Date('2025-08-15T10:00:00.000Z'),
          seller: { id: 'user-1', name: 'Test User', username: null }
        },
        {
          id: 'card-2', 
          title: 'Cheaper Card',
          condition: 'NEAR_MINT',
          price: 100.00,
          status: 'ACTIVE',
          createdAt: new Date('2025-08-15T11:00:00.000Z'),
          seller: { id: 'user-2', name: 'Another User', username: null }
        }
      ]
      mockedPrisma.card.findMany.mockResolvedValue(mockCards)

      const response = await GET(mockNextRequest('http://localhost:3000/api/cards?featured=true&limit=2'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: expect.any(Date) }
        },
        include: {
          seller: {
            select: { id: true, name: true, username: true }
          }
        },
        orderBy: [
          { price: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 2
      })
    })

    it('should filter by category when specified', async () => {
      const mockCards = [
        {
          id: 'card-1',
          title: 'Pokemon Card',
          condition: 'MINT',
          price: 100.00,
          category: 'Trading Cards',
          status: 'ACTIVE',
          seller: { id: 'user-1', name: 'Test User', username: null }
        }
      ]
      mockedPrisma.card.findMany.mockResolvedValue(mockCards)

      const response = await GET(mockNextRequest('http://localhost:3000/api/cards?category=Trading%20Cards'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          category: 'Trading Cards'
        },
        include: {
          seller: {
            select: { id: true, name: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: undefined
      })
    })
  })
})