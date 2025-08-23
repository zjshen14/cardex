import { GET } from '@/app/api/listings/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth/next', () => ({
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
      findMany: jest.fn(),
    },
  },
}))

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/listings', () => {
    it('should return user\'s listings when authenticated', async () => {
      // Mock session
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })

      // Mock user lookup
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })

      // Mock user's cards
      const mockCards = [
        {
          id: 'card-1',
          title: 'Charizard',
          description: 'Rare Pokemon card',
          condition: 'MINT',
          price: 100.00,
          category: 'Trading Cards',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          seller: {
            id: 'user-123',
            name: 'Test User',
            username: 'testuser'
          },
          transactions: [
            {
              id: 'txn-1',
              status: 'COMPLETED',
              amount: 100.00,
              createdAt: '2024-01-02T00:00:00Z',
              buyer: {
                name: 'Buyer Name',
                username: 'buyer'
              }
            }
          ]
        },
        {
          id: 'card-2',
          title: 'Blastoise',
          description: 'Water Pokemon',
          condition: 'NEAR_MINT',
          price: 75.00,
          category: 'Trading Cards',
          status: 'ACTIVE',
          createdAt: '2024-01-03T00:00:00Z',
          seller: {
            id: 'user-123',
            name: 'Test User',
            username: 'testuser'
          },
          transactions: []
        }
      ]

      mockedPrisma.card.findMany.mockResolvedValue(mockCards)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].title).toBe('Charizard')
      expect(data[0].transactions).toHaveLength(1)
      expect(data[1].title).toBe('Blastoise')
      expect(data[1].transactions).toHaveLength(0)

      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith({
        where: {
          sellerId: 'user-123',
          status: { not: 'DELETED' }
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
    })

    it('should return 401 when not authenticated', async () => {
      mockedGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should return empty array when user has no listings', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })
      mockedPrisma.card.findMany.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)
    })

    it('should handle database errors gracefully', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })
      mockedPrisma.card.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should only return active listings', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })

      const mockCards = [
        {
          id: 'card-1',
          title: 'Active Card',
          status: 'ACTIVE',
          seller: { id: 'user-123', name: 'Test', username: 'test' },
          transactions: []
        }
      ]
      mockedPrisma.card.findMany.mockResolvedValue(mockCards)

      await GET()

      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sellerId: 'user-123',
            status: { not: 'DELETED' }
          }
        })
      )
    })

    it('should order listings by creation date desc', async () => {
      mockedGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      })
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123'
      })
      mockedPrisma.card.findMany.mockResolvedValue([])

      await GET()

      expect(mockedPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc'
          }
        })
      )
    })
  })
})