/**
 * Profile API Route Tests
 * 
 * Key testing strategies:
 * 1. Mock all dependencies BEFORE importing the route handlers
 * 2. Create manual request objects instead of using NextRequest constructor
 * 3. Test business logic, not Next.js internals
 */

// Mock NextAuth at the very top before any imports
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn()
    }
  }
}))

// Now import the route handlers after all mocks are set up
import { GET, PUT } from '@/app/api/user/profile/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date('2023-01-01'),
        _count: {
          cards: 5,
          purchases: 3,
          sales: 2,
          watchlist: 4
        }
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockPrismaUser.findUnique.mockResolvedValue(mockUser)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUser)
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
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
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockPrismaUser.findUnique.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  describe('PUT', () => {
    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        username: 'updateduser',
        createdAt: new Date('2023-01-01'),
        _count: {
          cards: 5,
          purchases: 3,
          sales: 2,
          watchlist: 4
        }
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockPrismaUser.findFirst.mockResolvedValue(null) // No existing user with username
      mockPrismaUser.update.mockResolvedValue(mockUpdatedUser)

      // Create a manual request object instead of using NextRequest constructor
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          name: 'Updated Name',
          username: 'updateduser'
        })
      }

      const response = await PUT(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUpdatedUser)
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: 'Updated Name',
          username: 'updateduser'
        },
        select: expect.any(Object)
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'Test' })
      }

      const response = await PUT(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when username is already taken', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockPrismaUser.findFirst.mockResolvedValue({
        id: 'other-user',
        username: 'takenuser'
      })

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          username: 'takenuser'
        })
      }

      const response = await PUT(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Username is already taken')
    })

    it('should validate input types', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          name: 123 // Invalid type
        })
      }

      const response = await PUT(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name must be a string')
    })
  })
})