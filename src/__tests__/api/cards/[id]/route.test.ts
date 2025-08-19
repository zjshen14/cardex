import { NextRequest } from 'next/server'
import { GET, DELETE, PUT } from '@/app/api/cards/[id]/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock the image cleanup function
jest.mock('@/lib/imageCleanup', () => ({
  cleanupImages: jest.fn().mockResolvedValue(undefined),
}))

// Helper function to create mock request with proper json() method
const createMockRequest = (data?: Record<string, unknown>) => ({
  json: jest.fn().mockResolvedValue(data || {}),
}) as unknown as NextRequest

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
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/cards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/cards/[id]', () => {
    it('should return card details when card exists', async () => {
      const mockCard = {
        id: 'card-123',
        title: 'Test Card',
        description: 'A test card',
        condition: 'NEAR_MINT',
        price: 10.99,
        imageUrls: '["image1.jpg", "image2.jpg"]',
        category: 'Trading Cards',
        set: 'Base Set',
        rarity: 'Rare',
        cardNumber: '1/100',
        year: 2023,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerId: 'seller-123',
        seller: {
          id: 'seller-123',
          name: 'Test Seller',
          username: 'testseller'
        }
      }

      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue(mockCard)

      const response = await GET(
        {} as NextRequest,
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCard)
      expect(prisma.card.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'card-123',
          status: 'ACTIVE'
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              username: true,
              contactEmail: true,
              contactPhone: true,
              contactDiscord: true,
              contactTelegram: true,
              preferredContactMethod: true,
              contactNote: true,
              showEmail: true,
              showPhone: true,
              showDiscord: true,
              showTelegram: true,
            }
          }
        }
      })
    })

    it('should return 404 when card not found', async () => {
      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await GET(
        {} as NextRequest,
        { params: Promise.resolve({ id: 'nonexistent-card' }) }
      )

      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Card not found')
    })

    it('should handle database errors', async () => {
      ;(prisma.card.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET(
        {} as NextRequest,
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('DELETE /api/cards/[id]', () => {
    const cardId = 'card-123'
    const params = { params: Promise.resolve({ id: cardId }) }

    it('should delete a card when authenticated and owner', async () => {
      // Mock session
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })

      // Mock user lookup
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })

      // Mock card lookup
      mockedPrisma.card.findFirst.mockResolvedValue({
        id: cardId,
        title: 'Test Card',
        sellerId: 'user-123',
        status: 'ACTIVE'
      })

      // Mock card update (soft delete)
      mockedPrisma.card.update.mockResolvedValue({
        id: cardId,
        status: 'DELETED'
      })

      const request = createMockRequest()

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Card deleted successfully')
      expect(mockedPrisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { status: 'DELETED' }
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockedGetServerSession.mockResolvedValue(null)

      const request = createMockRequest()

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue(null)

      const request = createMockRequest()

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should return 404 when card not found or not owned by user', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })
      mockedPrisma.card.findFirst.mockResolvedValue(null)

      const request = createMockRequest()

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Card not found or you do not have permission to delete it')
    })

    it('should handle database errors gracefully', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })
      mockedPrisma.card.findFirst.mockResolvedValue({
        id: cardId,
        sellerId: 'user-123',
        status: 'ACTIVE'
      })
      mockedPrisma.card.update.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest()

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/cards/[id]', () => {
    it('should update an existing card successfully', async () => {
      const updateData = {
        title: 'Updated Charizard',
        description: 'Updated description',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        set: 'Updated Set',
        rarity: 'Ultra Rare',
        cardNumber: '1/100',
        year: '2000',
        price: '199.99',
      }

      const updatedCard = {
        id: 'card-123',
        ...updateData,
        price: 199.99,
        year: 2000,
        sellerId: 'user-123',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seller: {
          id: 'user-123',
          name: 'Test User',
          username: 'testuser'
        }
      }

      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue({
        id: 'card-123',
        sellerId: 'user-123',
        status: 'ACTIVE',
        imageUrls: '[]',
        price: 150.00,
      })
      ;(prisma.card.update as jest.Mock).mockResolvedValue(updatedCard)

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest

      const response = await PUT(
        mockRequest,
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual(updatedCard)
      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: {
          title: 'Updated Charizard',
          description: 'Updated description',
          condition: 'NEAR_MINT',
          category: 'Sports Cards',
          set: 'Updated Set',
          rarity: 'Ultra Rare',
          cardNumber: '1/100',
          year: 2000,
          price: 199.99,
          imageUrls: '[]',
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              username: true,
              contactEmail: true,
              contactPhone: true,
              contactDiscord: true,
              contactTelegram: true,
              preferredContactMethod: true,
              contactNote: true,
              showEmail: true,
              showPhone: true,
              showDiscord: true,
              showTelegram: true,
            }
          }
        }
      })
    })

    it('should handle empty optional fields correctly', async () => {
      const updateData = {
        title: 'Updated Charizard',
        description: '',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        set: '',
        rarity: '',
        cardNumber: '',
        year: '',
        price: '199.99',
      }

      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue({
        id: 'card-123',
        sellerId: 'user-123',
        status: 'ACTIVE',
        imageUrls: '[]',
        price: 150.00,
      })
      ;(prisma.card.update as jest.Mock).mockResolvedValue({
        id: 'card-123',
        title: 'Updated Charizard',
        price: 199.99,
      })

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(200)
      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: {
          title: 'Updated Charizard',
          description: null,
          condition: 'NEAR_MINT',
          category: 'Sports Cards',
          set: null,
          rarity: null,
          cardNumber: null,
          year: null,
          price: 199.99,
          imageUrls: '[]',
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              username: true,
              contactEmail: true,
              contactPhone: true,
              contactDiscord: true,
              contactTelegram: true,
              preferredContactMethod: true,
              contactNote: true,
              showEmail: true,
              showPhone: true,
              showDiscord: true,
              showTelegram: true,
            }
          }
        }
      })
    })

    it('should return 400 for missing required fields', async () => {
      const updateData = {
        description: 'Updated description',
        // Missing title, condition, category
      }

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toBe('Missing required fields: title, condition, and category are required')
    })

    it('should return 400 for invalid price', async () => {
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: 'invalid-price',
      }

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toBe('Price must be a valid positive number')
    })

    it('should return 400 for negative price', async () => {
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '-10.50',
      }

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toBe('Price must be a valid positive number')
    })

    it('should return 400 for invalid year', async () => {
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '199.99',
        year: '1800', // Too old
      }

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toContain('Year must be between 1900 and')
    })

    it('should return 400 for future year', async () => {
      const futureYear = new Date().getFullYear() + 1
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '199.99',
        year: futureYear.toString(),
      }

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.error).toContain('Year must be between 1900 and')
    })

    it('should return 404 for non-existent card', async () => {
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '199.99',
      }

      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.error).toBe('Card not found or you do not have permission to edit it')
    })

    it('should return 404 for card belonging to different user', async () => {
      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '199.99',
      }

      ;(prisma.card.findFirst as jest.Mock).mockResolvedValue(null) // Card not found for this user

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.error).toBe('Card not found or you do not have permission to edit it')
    })

    it('should return 401 for unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await PUT(
        createMockRequest({}),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(401)
      const result = await response.json()
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 500 for database errors', async () => {
      // Mock session first
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })

      const updateData = {
        title: 'Updated Charizard',
        condition: 'NEAR_MINT',
        category: 'Sports Cards',
        price: '199.99',
      }

      ;(prisma.card.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await PUT(
        createMockRequest(updateData),
        { params: Promise.resolve({ id: 'card-123' }) }
      )

      expect(response.status).toBe(500)
      const result = await response.json()
      expect(result.error).toBe('Internal server error')
    })
  })
})