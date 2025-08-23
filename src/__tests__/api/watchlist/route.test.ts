// Mock NextAuth before any imports
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
    },
    watchlist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { GET, POST, DELETE } from '@/app/api/watchlist/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

describe('/api/watchlist', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/watchlist', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found in database', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should return user watchlist successfully', async () => {
      const mockWatchlist = [
        {
          id: 'watchlist1',
          cardId: 'card1',
          userId: 'user1',
          createdAt: new Date(),
          card: {
            id: 'card1',
            title: 'Test Card',
            price: 100,
            condition: 'MINT',
            imageUrls: '["image1.jpg"]',
            category: 'Pokemon',
            seller: {
              id: 'seller1',
              name: 'Seller Name',
              username: 'seller_user'
            }
          }
        }
      ]

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.watchlist.findMany as jest.Mock).mockResolvedValue(mockWatchlist)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockWatchlist)
      expect(prisma.watchlist.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
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
    })
  })

  describe('POST /api/watchlist', () => {
    const createMockRequest = (body: object): NextRequest => ({
      json: () => Promise.resolve(body),
    } as unknown as NextRequest)

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)
      const request = createMockRequest({ cardId: 'card1' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when cardId is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      const request = createMockRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Card ID is required')
    })

    it('should return 404 when card not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.card.findUnique as jest.Mock).mockResolvedValue(null)
      
      const request = createMockRequest({ cardId: 'nonexistent' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Card not found')
    })

    it('should return 409 when card already in watchlist', async () => {
      const mockCard = { id: 'card1', title: 'Test Card' }
      const existingWatchlistEntry = { id: 'watchlist1', cardId: 'card1', userId: 'user1' }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard)
      ;(prisma.watchlist.findUnique as jest.Mock).mockResolvedValue(existingWatchlistEntry)
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Card already in watchlist')
    })

    it('should add card to watchlist successfully', async () => {
      const mockCard = { id: 'card1', title: 'Test Card' }
      const createdEntry = {
        id: 'watchlist1',
        cardId: 'card1',
        userId: 'user1',
        card: {
          ...mockCard,
          seller: { id: 'seller1', name: 'Seller', username: 'seller_user' }
        }
      }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard)
      ;(prisma.watchlist.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.watchlist.create as jest.Mock).mockResolvedValue(createdEntry)
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdEntry)
      expect(prisma.watchlist.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          cardId: 'card1'
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
    })
  })

  describe('DELETE /api/watchlist', () => {
    const createMockRequest = (body: object): NextRequest => ({
      json: () => Promise.resolve(body),
    } as unknown as NextRequest)

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)
      const request = createMockRequest({ cardId: 'card1' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when card not in watchlist', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.watchlist.findUnique as jest.Mock).mockResolvedValue(null)
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Card not in watchlist')
    })

    it('should remove card from watchlist successfully', async () => {
      const existingEntry = { id: 'watchlist1', cardId: 'card1', userId: 'user1' }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.watchlist.findUnique as jest.Mock).mockResolvedValue(existingEntry)
      ;(prisma.watchlist.delete as jest.Mock).mockResolvedValue(existingEntry)
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Card removed from watchlist')
      expect(prisma.watchlist.delete).toHaveBeenCalledWith({
        where: {
          userId_cardId: {
            userId: 'user1',
            cardId: 'card1'
          }
        }
      })
    })
  })

  describe('Error handling', () => {
    const createMockRequest = (body: object): NextRequest => ({
      json: () => Promise.resolve(body),
    } as unknown as NextRequest)

    it('should handle database errors in GET', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle database errors in POST', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle database errors in DELETE', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      
      const request = createMockRequest({ cardId: 'card1' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})