'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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
  })

  // Populate form when card changes
  useEffect(() => {
    if (card) {
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
      })
    }
  }, [card])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (card) {
      onSave(card.id, formData)
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