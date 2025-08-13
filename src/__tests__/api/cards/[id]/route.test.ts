import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/cards/[id]/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

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
const mockedPrisma = prisma as any

describe('/api/cards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE /api/cards/[id]', () => {
    const cardId = 'card-123'
    const params = { params: { id: cardId } }

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
        isActive: true
      })

      // Mock card update (soft delete)
      mockedPrisma.card.update.mockResolvedValue({
        id: cardId,
        isActive: false
      })

      const request = mockNextRequest(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Card deleted successfully')
      expect(mockedPrisma.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { isActive: false }
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockedGetServerSession.mockResolvedValue(null)

      const request = mockNextRequest(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
      })

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

      const request = mockNextRequest(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
      })

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

      const request = mockNextRequest(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
      })

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
        isActive: true
      })
      mockedPrisma.card.update.mockRejectedValue(new Error('Database error'))

      const request = mockNextRequest(`http://localhost/api/cards/${cardId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, params)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})