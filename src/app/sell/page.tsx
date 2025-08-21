'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { LoadingModal } from '@/components/LoadingModal'

export default function SellPage() {
  const { status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition: 'NEAR_MINT',
    price: '',
    category: 'Trading Cards',
    set: '',
    rarity: '',
    cardNumber: '',
    year: '',
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [modalStatus, setModalStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
    </div>
  }

  // Handle unauthenticated redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'unauthenticated') {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateFiles = (files: File[]) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    for (const file of files) {
      if (file.size > maxSize) {
        throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`)
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File "${file.name}" has invalid type. Only JPG, PNG, GIF, and WebP are allowed.`)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    try {
      if (files.length + imageFiles.length > 5) {
        setError('Maximum 5 images allowed')
        return
      }

      validateFiles(files)
      setError('') // Clear any previous errors
      
      setImageFiles(prev => [...prev, ...files])
      
      // Generate preview URLs
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid file selected')
      // Clear the input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return []

    const formData = new FormData()
    imageFiles.forEach(file => {
      formData.append('files', file)
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload images')
    }

    const result = await response.json()
    return result.urls
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    try {
      if (files.length + imageFiles.length > 5) {
        setError('Maximum 5 images allowed')
        return
      }

      validateFiles(files)
      setError('') // Clear any previous errors

      setImageFiles(prev => [...prev, ...files])
      
      // Generate preview URLs
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid files dropped')
    }
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    setModalStatus('loading')

    try {
      // Upload images first
      const imageUrls = await uploadImages()
      
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrls,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create listing')
      }

      const result = await response.json()
      console.log('Card created:', result)
      
      // Show success state
      setModalStatus('success')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        condition: 'NEAR_MINT',
        price: '',
        category: 'Trading Cards',
        set: '',
        rarity: '',
        cardNumber: '',
        year: '',
      })
      setImageFiles([])
      setImagePreviews([])
      
    } catch (error) {
      console.error('Error creating listing:', error)
      setError(error instanceof Error ? error.message : 'Failed to create listing')
      setModalStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalSuccess = () => {
    setModalStatus(null)
    router.push('/listings')
  }

  const handleModalError = () => {
    setModalStatus(null)
    // Allow user to try again
  }

  const handleModalClose = () => {
    setModalStatus(null)
  }

  return (
    <>
      <LoadingModal
        isOpen={modalStatus !== null}
        status={modalStatus || 'loading'}
        title="Creating Your Listing"
        loadingMessage="Please wait while we create your card listing..."
        successMessage="Your card has been listed successfully!"
        errorMessage={error || "Something went wrong while creating your listing."}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
        onClose={handleModalClose}
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Sell Your Card</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Card Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Charizard Base Set"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the card condition, any flaws, or special features..."
              />
            </div>

            {/* Row 1: Category and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Trading Cards">Trading Cards</option>
                  <option value="Sports Cards">Sports Cards</option>
                  <option value="Gaming Cards">Gaming Cards</option>
                  <option value="Collectible Cards">Collectible Cards</option>
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MINT">Mint</option>
                  <option value="NEAR_MINT">Near Mint</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="LIGHT_PLAYED">Light Played</option>
                  <option value="PLAYED">Played</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
            </div>

            {/* Row 2: Set and Rarity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="set" className="block text-sm font-medium text-gray-700 mb-2">
                  Set
                </label>
                <input
                  type="text"
                  id="set"
                  name="set"
                  value={formData.set}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Base Set, Unlimited"
                />
              </div>

              <div>
                <label htmlFor="rarity" className="block text-sm font-medium text-gray-700 mb-2">
                  Rarity
                </label>
                <input
                  type="text"
                  id="rarity"
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Rare, Common, Ultra Rare"
                />
              </div>
            </div>

            {/* Row 3: Card Number and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 4/102"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1999"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Images (Max 5)
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className={`h-12 w-12 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDragging ? 'text-blue-600' : 'text-gray-600'}`}>
                    {isDragging ? 'Drop images here' : 'Click to upload images or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}