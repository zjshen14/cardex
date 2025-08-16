'use client'

import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'

interface Card {
  id: string
  title: string
  description: string | null
  condition: string
  price: number
  category: string
  set: string | null
  rarity: string | null
  cardNumber: string | null
  year: number | null
  imageUrls: string
}

interface EditListingDialogProps {
  isOpen: boolean
  card: Card | null
  onClose: () => void
  onSave: (cardId: string, formData: FormData) => void
  isLoading: boolean
}

interface FormData {
  title: string
  description: string
  condition: string
  price: string
  category: string
  set: string
  rarity: string
  cardNumber: string
  year: string
  imageUrls: string[]
}

export function EditListingDialog({ isOpen, card, onClose, onSave, isLoading }: EditListingDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    condition: 'NEAR_MINT',
    price: '',
    category: 'Trading Cards',
    set: '',
    rarity: '',
    cardNumber: '',
    year: '',
    imageUrls: [],
  })
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Populate form when card changes
  useEffect(() => {
    if (card) {
      let existingImages: string[] = []
      try {
        existingImages = typeof card.imageUrls === 'string' ? JSON.parse(card.imageUrls) : card.imageUrls
      } catch (error) {
        console.error('Failed to parse imageUrls:', error)
        existingImages = []
      }

      setFormData({
        title: card.title,
        description: card.description || '',
        condition: card.condition,
        price: card.price.toString(),
        category: card.category,
        set: card.set || '',
        rarity: card.rarity || '',
        cardNumber: card.cardNumber || '',
        year: card.year?.toString() || '',
        imageUrls: existingImages,
      })
      
      // Clear new image state when card changes
      setNewImageFiles([])
      setNewImagePreviews([])
    }
  }, [card])

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

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = formData.imageUrls.length + newImageFiles.length + files.length
    
    try {
      if (totalImages > 5) {
        throw new Error('Maximum 5 images allowed')
      }

      validateFiles(files)
      
      setNewImageFiles(prev => [...prev, ...files])
      
      // Generate preview URLs
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid file selected')
      // Clear the input
      if (e.target) {
        e.target.value = ''
      }
    }
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
    const totalImages = formData.imageUrls.length + newImageFiles.length + files.length
    
    try {
      if (totalImages > 5) {
        throw new Error('Maximum 5 images allowed')
      }

      validateFiles(files)

      setNewImageFiles(prev => [...prev, ...files])
      
      // Generate preview URLs
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid files dropped')
    }
  }

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadNewImages = async () => {
    if (newImageFiles.length === 0) return []

    const formData = new FormData()
    newImageFiles.forEach(file => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (card) {
      try {
        // Upload new images if any
        const newImageUrls = await uploadNewImages()
        
        // Combine existing and new image URLs
        const allImageUrls = [...formData.imageUrls, ...newImageUrls]
        
        onSave(card.id, {
          ...formData,
          imageUrls: allImageUrls
        })
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to upload images')
      }
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl" role="dialog" aria-modal="true">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Listing
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Title *
                </label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g., Charizard Base Set"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Describe the card condition, any flaws, or special features..."
                />
              </div>

              {/* Row 1: Category and Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="Trading Cards">Trading Cards</option>
                    <option value="Sports Cards">Sports Cards</option>
                    <option value="Gaming Cards">Gaming Cards</option>
                    <option value="Collectible Cards">Collectible Cards</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    id="edit-condition"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-set" className="block text-sm font-medium text-gray-700 mb-1">
                    Set
                  </label>
                  <input
                    type="text"
                    id="edit-set"
                    name="set"
                    value={formData.set}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., Base Set, Unlimited"
                  />
                </div>

                <div>
                  <label htmlFor="edit-rarity" className="block text-sm font-medium text-gray-700 mb-1">
                    Rarity
                  </label>
                  <input
                    type="text"
                    id="edit-rarity"
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., Rare, Common, Ultra Rare"
                  />
                </div>
              </div>

              {/* Row 3: Card Number and Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="edit-cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., 4/102"
                  />
                </div>

                <div>
                  <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    id="edit-year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., 1999"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  id="edit-price"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Images (Max 5)
                </label>

                {/* Existing Images */}
                {formData.imageUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {formData.imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Current ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            disabled={isLoading}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                {(formData.imageUrls.length + newImageFiles.length) < 5 && (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
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
                      onChange={handleNewImageUpload}
                      disabled={isLoading}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDragging ? 'text-blue-600' : 'text-gray-600'}`}>
                        {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB each
                      </span>
                    </label>
                  </div>
                )}

                {/* New Image Previews */}
                {newImagePreviews.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">New Images to Upload:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`New ${index + 1}`}
                            className="w-full h-20 object-cover rounded border border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            disabled={isLoading}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}