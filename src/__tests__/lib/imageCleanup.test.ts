import { cleanupImages } from '@/lib/imageCleanup'
import { unlink } from 'fs/promises'
import { join } from 'path'

// Mock fs functions
jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}))

// Mock supabaseStorage for production tests
jest.mock('@/lib/supabaseStorage', () => ({
  deleteMultipleImages: jest.fn(),
}))

describe('Image Cleanup', () => {
  const mockUnlink = unlink as jest.MockedFunction<typeof unlink>
  
  // Mock environment variables
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Console methods should be mocked to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Reset environment to development for each test
    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
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

    it('should clean up valid image URLs from array in development', async () => {
      const imageUrls = [
        '/uploads/cards/image1.jpg',
        '/uploads/cards/image2.png',
      ]
      
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(2)
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', '/uploads/cards/image1.jpg')
      )
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', '/uploads/cards/image2.png')
      )
    })

    it('should clean up valid image URLs from JSON string in development', async () => {
      const imageUrls = JSON.stringify([
        '/uploads/cards/image1.jpg',
        '/uploads/cards/image2.png',
      ])
      
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(2)
    })

    it('should only process local image URLs in development', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        '/uploads/cards/local-image.jpg',
        'http://another-site.com/image2.png',
      ]
      
      mockUnlink.mockResolvedValue(undefined)

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(mockUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'public', '/uploads/cards/local-image.jpg')
      )
    })

    it('should handle files that do not exist gracefully', async () => {
      const imageUrls = ['/uploads/cards/nonexistent.jpg']
      
      mockUnlink.mockRejectedValue(new Error('ENOENT: no such file or directory'))

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to delete local file: /uploads/cards/nonexistent.jpg',
        expect.any(Error)
      )
    })

    it('should handle file system errors gracefully', async () => {
      const imageUrls = ['/uploads/cards/error-file.jpg']
      
      mockUnlink.mockRejectedValue(new Error('Permission denied'))

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to delete local file: /uploads/cards/error-file.jpg', 
        expect.any(Error)
      )
    })

    it('should handle invalid JSON gracefully', async () => {
      await cleanupImages('invalid-json')

      expect(mockUnlink).not.toHaveBeenCalled()
      // Invalid JSON is handled gracefully by parseImageUrls returning []
    })

    it('should continue cleanup even if some files fail', async () => {
      const imageUrls = [
        '/uploads/cards/success.jpg',
        '/uploads/cards/error.jpg',
        '/uploads/cards/success2.jpg',
      ]
      
      mockUnlink
        .mockResolvedValueOnce(undefined)  // success.jpg
        .mockRejectedValueOnce(new Error('Failed'))  // error.jpg
        .mockResolvedValueOnce(undefined)  // success2.jpg

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(3)
      expect(console.warn).toHaveBeenCalledTimes(1) // One warning for failed deletion
      expect(console.log).toHaveBeenCalledTimes(1) // One final log message with count
    })

    it('should handle mixed success and failure files', async () => {
      const imageUrls = [
        '/uploads/cards/exists.jpg',
        '/uploads/cards/missing.jpg',
      ]
      
      mockUnlink
        .mockResolvedValueOnce(undefined)  // exists.jpg - success
        .mockRejectedValueOnce(new Error('ENOENT'))  // missing.jpg - fails

      await cleanupImages(imageUrls)

      expect(mockUnlink).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenCalledTimes(1) // Final success message
      expect(console.warn).toHaveBeenCalledTimes(1) // Warning for failed deletion
    })

    it('should use Supabase storage in production', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const { deleteMultipleImages } = await import('@/lib/supabaseStorage')
      deleteMultipleImages.mockResolvedValue(undefined)

      const imageUrls = ['/uploads/cards/image1.jpg', '/uploads/cards/image2.jpg']
      
      await cleanupImages(imageUrls)

      expect(deleteMultipleImages).toHaveBeenCalledWith(imageUrls)
      expect(mockUnlink).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Cleaned up images:', 2, 'files')
    })
  })
})