import { createMocks } from 'node-mocks-http'
import { POST } from '../../../app/api/auth/register/route'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe.skip('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    // Mock that user doesn't exist
    mockPrisma.user.findUnique.mockResolvedValue(null)
    
    // Mock password hashing
    mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never)
    
    // Mock user creation
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: null,
      username: null,
    }
    mockPrisma.user.create.mockResolvedValue(mockUser)

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    // Mock req.json() method
    req.json = jest.fn().mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await POST(req as Request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('User created successfully')
    expect(data.user).toEqual(mockUser)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    })
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: null,
        username: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      }
    })
  })

  it('should return error if user already exists', async () => {
    // Mock that user exists
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    })

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    req.json = jest.fn().mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await POST(req as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User already exists')
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('should return error if email or password is missing', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
      },
    })

    req.json = jest.fn().mockResolvedValue({
      email: 'test@example.com',
    })

    const response = await POST(req as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should handle database errors', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    req.json = jest.fn().mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await POST(req as Request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})