import { cleanupImages } from '@/lib/imageCleanup'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

// Mock fs functions
jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

describe('Image Cleanup', () => {
  const mockUnlink = unlink as jest.MockedFunction<typeof unlink>
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>

  beforeEach(() => {
    jest.clearAllMocks()
    // Console methods should be mocked to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('cleanupImages', () => {
    it('should handle empty array', async () => {
      await cleanupImages([])
      
      expect(mockUnlink).not.toHaveBeenCalled()
    })

    it('should handle empty JSON string', async () => {
      await cleanupImages('[]')
      
      expect(mockUnlink).not.toHaveBeenCalled()
    })

    it('should clean up valid image URLs from array', async () => {
      const imageUrls = [
        '/uploads/cards/image1.jpg',
        '/uploads/cards/image2.png',
      ]
      
      mockExistsSync.mockReturnValue(true)
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockExistsSync).toHaveBeenCalledTimes(2)
      expect(mockUnlink).toHaveBeenCalledTimes(2)
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'uploads', 'cards', 'image1.jpg')
      )
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'uploads', 'cards', 'image2.png')
      )
    })

    it('should clean up valid image URLs from JSON string', async () => {
      const imageUrls = JSON.stringify([
        '/uploads/cards/image1.jpg',
        '/uploads/cards/image2.png',
      ])
      
      mockExistsSync.mockReturnValue(true)
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(2)
    })

    it('should skip non-local image URLs', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        '/uploads/cards/local-image.jpg',
        'http://another-site.com/image2.png',
      ]
      
      mockExistsSync.mockReturnValue(true)
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'uploads', 'cards', 'local-image.jpg')
      )
      expect(console.warn).toHaveBeenCalledWith('Skipping non-local image URL:', 'https://example.com/image1.jpg')
      expect(console.warn).toHaveBeenCalledWith('Skipping non-local image URL:', 'http://another-site.com/image2.png')
    })

    it('should handle files that do not exist', async () => {
      const imageUrls = ['/uploads/cards/nonexistent.jpg']
      
      mockExistsSync.mockReturnValue(false)

      await cleanupImages(imageUrls)

      expect(mockExistsSync).toHaveBeenCalledTimes(1)
      expect(mockUnlink).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith(
        'Image file not found:', 
        join(process.cwd(), 'public', 'uploads', 'cards', 'nonexistent.jpg')
      )
    })

    it('should handle file system errors gracefully', async () => {
      const imageUrls = ['/uploads/cards/error-file.jpg']
      
      mockExistsSync.mockReturnValue(true)
      mockUnlink.mockRejectedValue(new Error('Permission denied'))

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting image file:', 
        '/uploads/cards/error-file.jpg', 
        expect.any(Error)
      )
    })

    it('should handle invalid JSON gracefully', async () => {
      await cleanupImages('invalid-json')

      expect(mockUnlink).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Failed to parse imageUrls JSON:', expect.any(Error))
    })

    it('should continue cleanup even if some files fail', async () => {
      const imageUrls = [
        '/uploads/cards/success.jpg',
        '/uploads/cards/error.jpg',
        '/uploads/cards/success2.jpg',
      ]
      
      mockExistsSync.mockReturnValue(true)
      mockUnlink
        .mockResolvedValueOnce(undefined)  // success.jpg
        .mockRejectedValueOnce(new Error('Failed'))  // error.jpg
        .mockResolvedValueOnce(undefined)  // success2.jpg

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(3)
      expect(console.log).toHaveBeenCalledTimes(2) // Only successful deletions
      expect(console.error).toHaveBeenCalledTimes(1) // One error
    })

    it('should handle mixed existing and non-existing files', async () => {
      const imageUrls = [
        '/uploads/cards/exists.jpg',
        '/uploads/cards/missing.jpg',
      ]
      
      mockExistsSync
        .mockReturnValueOnce(true)   // exists.jpg
        .mockReturnValueOnce(false)  // missing.jpg
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledTimes(1)
    })
  })
})