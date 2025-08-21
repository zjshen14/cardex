import { POST } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'
import { existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import * as fsPromises from 'fs/promises'

// Mock file system functions for testing
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

describe('/api/upload', () => {
  const mockWriteFile = fsPromises.writeFile as jest.MockedFunction<typeof fsPromises.writeFile>
  const mockMkdir = fsPromises.mkdir as jest.MockedFunction<typeof fsPromises.mkdir>
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any test files that might have been created
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'cards')
    if (existsSync(uploadDir)) {
      try {
        const files = readdirSync(uploadDir)
        files.forEach(file => {
          if (file.startsWith('card_test_')) {
            unlinkSync(join(uploadDir, file))
          }
        })
      } catch {
        // Ignore cleanup errors in tests
      }
    }
  })

  const createMockFile = (name: string, type: string, size: number = 1024): File => {
    const content = new ArrayBuffer(size)
    const file = new File([content], name, { type })
    
    // Add arrayBuffer method for testing
    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(content),
      writable: true,
    })
    
    return file
  }

  const createMockRequest = (files: File[]): NextRequest => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    return {
      formData: () => Promise.resolve(formData),
    } as unknown as NextRequest
  }

  describe('POST /api/upload', () => {
    it('should upload valid image files successfully', async () => {
      mockExistsSync.mockReturnValue(true)
      mockWriteFile.mockResolvedValue(undefined)

      const files = [
        createMockFile('test1.jpg', 'image/jpeg'),
        createMockFile('test2.png', 'image/png'),
      ]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Files uploaded successfully')
      expect(data.urls).toHaveLength(2)
      expect(data.urls[0]).toMatch(/\/uploads\/cards\/\d+-\w+\.jpg/)
      expect(data.urls[1]).toMatch(/\/uploads\/cards\/\d+-\w+\.png/)
      expect(mockWriteFile).toHaveBeenCalledTimes(2)
    })

    it('should create upload directory if it does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      const files = [createMockFile('test.jpg', 'image/jpeg')]
      const request = createMockRequest(files)

      await POST(request)

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringMatching(/public\/uploads\/cards$/),
        { recursive: true }
      )
    })

    it('should reject requests with no files', async () => {
      const request = createMockRequest([])

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No files provided')
    })

    it('should reject requests with too many files', async () => {
      const files = Array(6).fill(null).map((_, i) => 
        createMockFile(`test${i}.jpg`, 'image/jpeg')
      )
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Maximum 5 files allowed')
    })

    it('should reject files with invalid types', async () => {
      const files = [createMockFile('test.txt', 'text/plain')]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Invalid file type: text/plain')
    })

    it('should reject files that are too large', async () => {
      const largeSize = 11 * 1024 * 1024 // 11MB
      const files = [createMockFile('large.jpg', 'image/jpeg', largeSize)]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('File too large: large.jpg')
    })

    it('should handle mixed valid and invalid file types', async () => {
      const files = [
        createMockFile('valid.jpg', 'image/jpeg'),
        createMockFile('invalid.txt', 'text/plain'),
      ]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Invalid file type: text/plain')
      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it('should accept all supported image types', async () => {
      mockExistsSync.mockReturnValue(true)
      mockWriteFile.mockResolvedValue(undefined)

      const files = [
        createMockFile('test.jpg', 'image/jpeg'),
        createMockFile('test.png', 'image/png'),
        createMockFile('test.gif', 'image/gif'),
        createMockFile('test.webp', 'image/webp'),
      ]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Files uploaded successfully')
      expect(data.urls).toHaveLength(4)
    })

    it('should handle file system errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true)
      mockWriteFile.mockRejectedValue(new Error('Disk full'))

      const files = [createMockFile('test.jpg', 'image/jpeg')]
      const request = createMockRequest(files)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Disk full')
    })
  })
})