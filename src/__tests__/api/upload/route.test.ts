// Mock NextAuth before any imports
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { POST } from '@/app/api/upload/route'
import { getServerSession } from 'next-auth/next'
import { NextRequest } from 'next/server'
import { existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import * as fsPromises from 'fs/promises'
import { fileTypeFromBuffer } from 'file-type'

// Mock file system functions for testing
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

// Mock file-type for testing using manual mock
jest.mock('file-type')

describe('/api/upload', () => {
  const mockWriteFile = fsPromises.writeFile as jest.MockedFunction<typeof fsPromises.writeFile>
  const mockMkdir = fsPromises.mkdir as jest.MockedFunction<typeof fsPromises.mkdir>
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
  const mockFileTypeFromBuffer = fileTypeFromBuffer as jest.MockedFunction<typeof fileTypeFromBuffer>

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock authenticated session by default
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user1', email: 'test@example.com' }
    })
    // Mock successful file type detection by default
    mockFileTypeFromBuffer.mockResolvedValue({
      ext: 'jpg',
      mime: 'image/jpeg'
    })
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
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)
      
      const formData = new FormData()
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('files', file)

      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

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

    describe('Content-based file validation', () => {
      it('should reject files with spoofed extensions (malicious file)', async () => {
        mockExistsSync.mockReturnValue(true)
        // Mock file-type detection finding a different type than claimed
        mockFileTypeFromBuffer.mockResolvedValue({
          ext: 'exe',
          mime: 'application/octet-stream'
        })

        const files = [createMockFile('malicious.jpg', 'image/jpeg')] // Claims to be JPEG
        const request = createMockRequest(files)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toContain('File content does not match allowed types')
        expect(data.error).toContain('application/octet-stream')
        expect(mockWriteFile).not.toHaveBeenCalled()
      })

      it('should reject files when content type cannot be detected', async () => {
        mockExistsSync.mockReturnValue(true)
        // Mock file-type detection returning null (unrecognizable content)
        mockFileTypeFromBuffer.mockResolvedValue(null)

        const files = [createMockFile('unknown.jpg', 'image/jpeg')]
        const request = createMockRequest(files)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toContain('Unable to detect file type')
        expect(mockWriteFile).not.toHaveBeenCalled()
      })

      it('should accept valid image files with correct content', async () => {
        mockExistsSync.mockReturnValue(true)
        mockWriteFile.mockResolvedValue(undefined)
        // Mock file-type detection confirming it's a valid JPEG
        mockFileTypeFromBuffer.mockResolvedValue({
          ext: 'jpg',
          mime: 'image/jpeg'
        })

        const files = [createMockFile('valid.jpg', 'image/jpeg')]
        const request = createMockRequest(files)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Files uploaded successfully')
        expect(data.urls).toHaveLength(1)
        expect(mockFileTypeFromBuffer).toHaveBeenCalledWith(expect.any(Buffer))
      })

      it('should handle MIME type normalization (jpg vs jpeg)', async () => {
        mockExistsSync.mockReturnValue(true)
        mockWriteFile.mockResolvedValue(undefined)
        // Mock file-type detecting image/jpeg while browser reports image/jpg
        mockFileTypeFromBuffer.mockResolvedValue({
          ext: 'jpg', 
          mime: 'image/jpeg'
        })

        const files = [createMockFile('test.jpg', 'image/jpg')] // Browser reports image/jpg
        const request = createMockRequest(files)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Files uploaded successfully')
        expect(data.urls).toHaveLength(1)
      })

      it('should validate all supported image types with content verification', async () => {
        mockExistsSync.mockReturnValue(true)
        mockWriteFile.mockResolvedValue(undefined)

        const testCases = [
          { file: 'test.jpg', reportedType: 'image/jpeg', detectedMime: 'image/jpeg', ext: 'jpg' },
          { file: 'test.png', reportedType: 'image/png', detectedMime: 'image/png', ext: 'png' },
          { file: 'test.gif', reportedType: 'image/gif', detectedMime: 'image/gif', ext: 'gif' },
          { file: 'test.webp', reportedType: 'image/webp', detectedMime: 'image/webp', ext: 'webp' }
        ]

        for (const testCase of testCases) {
          mockFileTypeFromBuffer.mockResolvedValue({
            ext: testCase.ext,
            mime: testCase.detectedMime
          })

          const files = [createMockFile(testCase.file, testCase.reportedType)]
          const request = createMockRequest(files)

          const response = await POST(request)
          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.message).toBe('Files uploaded successfully')
        }
      })

      it('should log warning for MIME type mismatches but still allow valid content', async () => {
        mockExistsSync.mockReturnValue(true)
        mockWriteFile.mockResolvedValue(undefined)
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

        // Mock file-type detecting PNG while browser reports JPEG
        mockFileTypeFromBuffer.mockResolvedValue({
          ext: 'png',
          mime: 'image/png' // Content is actually PNG
        })

        const files = [createMockFile('mismatch.jpg', 'image/jpeg')] // Claims to be JPEG
        const request = createMockRequest(files)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200) // Should still succeed since PNG is allowed
        expect(data.message).toBe('Files uploaded successfully')
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('MIME type mismatch')
        )

        consoleSpy.mockRestore()
      })
    })
  })
})